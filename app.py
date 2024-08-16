from flask import Flask, render_template, jsonify, request,Response
import requests
import logging
from collections import defaultdict
from collections import Counter
from datetime import datetime
import pandas as pd
import io
import urllib.parse

app = Flask(__name__, template_folder='templates')

# logging.basicConfig(level=logging.DEBUG)

# @app.before_request
# def before_request():
#     if request.url.startswith('http://'):
#         url = request.url.replace('http://', 'https://', 1)
#         return redirect(url, code=301)

# API Endpoints
BASE_URL = "https://fantasy.premierleague.com/api/"
BOOTSTRAP_STATIC_URL = f"{BASE_URL}bootstrap-static/"
FIXTURES_URL = f"{BASE_URL}fixtures/"
ENTRY_URL = f"{BASE_URL}entry/"

# Fetch and cache bootstrap static data
bootstrap_static_data = requests.get(BOOTSTRAP_STATIC_URL).json()
teams = {team['id']: team['name'] for team in bootstrap_static_data['teams']}
element_types = {element['id']: element['plural_name_short'] for element in bootstrap_static_data['element_types']}
players = bootstrap_static_data['elements']

ITEMS_PER_PAGE = 8
TRANSFERS_ITEMS_PER_PAGE = 10
CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTtmBr6M5IENX5D2TN_Sdr1_2hqbS2MqVxm-faCDyT36vTyGrYUnx17Ln9qfiTPUkf7DT8KhITbq3yo/pub?output=csv"

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'favicon.ico', mimetype='image/vnd.microsoft.icon')

def fetch_google_sheet_data(url):
    response = requests.get(url)
    response.raise_for_status()
    data = response.content.decode('utf-8')
    df = pd.read_csv(io.StringIO(data))
    return df

@app.route('/api/top_players', methods=['GET'])
def get_top_players():
    top_players = sorted(players, key=lambda x: float(x['selected_by_percent']), reverse=True)[:3]
    result = [{
        'name': player['web_name'],
        'selected_by_percent': player['selected_by_percent'],
        'photo': f"https://resources.premierleague.com/premierleague/photos/players/110x140/p{player['photo'].replace('.jpg', '')}.png"
    } for player in top_players]
    return jsonify(result)

@app.route('/api/teams')
def get_teams():
    url = 'https://fantasy.premierleague.com/api/bootstrap-static/'
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        return jsonify(data)
    else:
        return jsonify({"error": "Failed to fetch data"}), response.status_code

@app.route('/checkreg')
def checkreg_page():
    return render_template('checkreg.html')

@app.route('/api/check_registration', methods=['GET'])
def check_registration():
    try:
        name = request.args.get('name')
        df = fetch_google_sheet_data(CSV_URL)
        if 'name' not in df.columns or 'league' not in df.columns:
            return jsonify({'error': 'Required columns not found in the data'}), 500

        if name in df['name'].values:
            row = df.loc[df['name'] == name].iloc[0]
            column_k_content = row['league']  # Assuming column K is named 'league'
            return jsonify({'registered': True, 'column_k_content': column_k_content})
        else:
            return jsonify({'registered': False})
    except Exception as e:
        logging.error(f"Error in check_registration: {e}")
        return jsonify({'error': 'An error occurred while processing the data'}), 500



def score_player(player):
    factors = [
        'goals_scored', 'chance_of_playing_next_round', 'cost_change_event', 'points_per_game', 'value_form', 'bonus',
        'bps', 'influence', 'creativity', 'threat', 'expected_goals', 'expected_assists', 'expected_goal_involvements',
        'expected_goals_conceded', 'influence_rank', 'creativity_rank', 'threat_rank', 'expected_goals_per_90',
        'saves_per_90', 'expected_assists_per_90', 'expected_goal_involvements_per_90', 'expected_goals_conceded_per_90',
        'starts_per_90'
    ]
    
    player_scores = {factor: float(player.get(factor, 0) or 0) for factor in factors}
    player_scores['negative_factors'] = player_scores['expected_goals_conceded_per_90'] + player_scores['expected_goals_conceded']
    
    total_score = sum(player_scores.values()) - player_scores['negative_factors']
    
    return total_score

@app.route('/api/feature_player', methods=['GET'])
def get_feature_player():
    try:
        gameweek_data = []
        for event_id in range(34, 39):  # Last 5 gameweeks
            response = requests.get(f"{BASE_URL}event/{event_id}/live/")
            response.raise_for_status()
            gameweek_data.append(response.json())

        best_player = None
        best_points = 0

        for gameweek in gameweek_data:
            for player in gameweek['elements']:
                player_points = player['stats']['total_points']
                if player_points > best_points:
                    best_points = player_points
                    best_player = player

        if best_player:
            player_info = next(p for p in bootstrap_static_data['elements'] if p['id'] == best_player['id'])
            team_name = teams[player_info['team']]
            feature_player = {
                'name': player_info['web_name'],
                'full_name': f"{player_info['first_name']} {player_info['second_name']}",
                'team': team_name,
                'photo': f"https://resources.premierleague.com/premierleague/photos/players/110x140/p{player_info['photo'].replace('.jpg', '')}.png",
                'goals': best_player['stats']['goals_scored'],
                'assists': best_player['stats']['assists'],
                'total_points': best_player['stats']['total_points']
            }
            return jsonify(feature_player)
        else:
            return jsonify({'error': 'No player found'}), 404
    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching feature player: {e}")
        return jsonify({"error": "Failed to fetch feature player"}), 500



@app.route('/enter_id')
def enter_id_page():
    return render_template('enter_id.html')

@app.route('/api/weekly_squad', methods=['GET'])
def get_weekly_squad():
    try:
        # Adjust gameweek range for the current season
        current_season_gameweeks = range(1, 6)  # Example: Adjust this to the relevant gameweek range
        
        gameweek_data = []
        for event_id in current_season_gameweeks:
            response = requests.get(f"{BASE_URL}event/{event_id}/live/")
            if response.status_code == 200:
                gameweek_data.append(response.json())

        # If no gameweek data is found, return a message
        if not gameweek_data:
            return jsonify({"error": "Feature squad will be available after GW1."}), 404

        player_scores = defaultdict(int)
        player_costs = {}
        player_positions = {}
        player_teams = {}
        team_counts = defaultdict(int)

        for gameweek in gameweek_data:
            for player in gameweek['elements']:
                player_id = player['id']
                player_scores[player_id] += player['stats']['total_points']
                if player_id not in player_costs:
                    player_info = next(p for p in bootstrap_static_data['elements'] if p['id'] == player_id)
                    player_costs[player_id] = player_info['now_cost'] / 10.0
                    player_positions[player_id] = player_info['element_type']
                    player_teams[player_id] = player_info['team']

        total_cost = 0.0
        squad = []
        bench = []
        positions = {"GKP": 2, "DEF": 5, "MID": 5, "FWD": 3}
        position_ids = {1: "GKP", 2: "DEF", 3: "MID", 4: "FWD"}

        for position_id, position in position_ids.items():
            players_in_position = [pid for pid in player_scores if player_positions[pid] == position_id]
            players_in_position.sort(key=lambda pid: player_scores[pid], reverse=True)

            selected_players = []
            for player_id in players_in_position:
                if total_cost + player_costs[player_id] <= 100.0 and len(selected_players) < positions[position]:
                    if team_counts[player_teams[player_id]] < 3:
                        selected_players.append(player_id)
                        total_cost += player_costs[player_id]
                        team_counts[player_teams[player_id]] += 1

            if len(selected_players) > positions[position] - 1:
                squad.extend(selected_players[:positions[position] - 1])
                bench.extend(selected_players[positions[position] - 1:])
            else:
                squad.extend(selected_players)

        weekly_squad = {
            'squad': [{'id': pid, 'name': next(p['web_name'] for p in bootstrap_static_data['elements'] if p['id'] == pid), 'photo': f"https://resources.premierleague.com/premierleague/photos/players/110x140/p{next(p['photo'] for p in bootstrap_static_data['elements'] if p['id'] == pid).replace('.jpg', '')}.png", 'position': position_ids[player_positions[pid]]} for pid in squad],
            'bench': [{'id': pid, 'name': next(p['web_name'] for p in bootstrap_static_data['elements'] if p['id'] == pid), 'photo': f"https://resources.premierleague.com/premierleague/photos/players/110x140/p{next(p['photo'] for p in bootstrap_static_data['elements'] if p['id'] == pid).replace('.jpg', '')}.png", 'position': position_ids[player_positions[pid]]} for pid in bench]
        }

        return jsonify(weekly_squad)
    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching weekly squad: {e}")
        return jsonify({"error": "Failed to fetch weekly squad"}), 500


@app.route('/classic-league')
def classic_league_page():
    return render_template('classic-league.html')
# Helper function to fetch all pages of data
def fetch_all_pages(url_template, key):
    page = 1
    all_data = []
    while True:
        url = url_template.format(page=page)
        response = requests.get(url)
        if response.status_code != 200:
            break
        data = response.json()
        results = data['standings'][key]
        if not results:
            break
        all_data.extend(results)
        page += 1
    return all_data


@app.route('/api/classic-standings-full', methods=['GET'])
def get_classic_standings_full():
    try:
        url_template = "https://fantasy.premierleague.com/api/leagues-classic/604351/standings/?page_new_entries=1&page_standings={page}&phase=1"
        standings = fetch_all_pages(url_template, 'results')
        classic_standings = [
            {"rank": entry['rank'], "entry_name": entry['entry_name'], "player_name": entry['player_name'], "total": entry['total']}
            for entry in standings
        ]
        return jsonify(classic_standings)
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/ultimate-standings-full', methods=['GET'])
def get_ultimate_standings_full():
    try:
        url_template = "https://fantasy.premierleague.com/api/leagues-classic/345282/standings/?page_new_entries=1&page_standings={page}&phase=1"
        standings = fetch_all_pages(url_template, 'results')
        ultimate_standings = [
            {"rank": entry['rank'], "entry_name": entry['entry_name'], "player_name": entry['player_name'], "total": entry['total']}
            for entry in standings
        ]
        return jsonify(ultimate_standings)
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500


@app.route('/compare')
def compare_page():
    teams = {team['id']: team['name'] for team in bootstrap_static_data['teams']}
    players = [
        {
            'id': player['id'],
            'first_name': player['first_name'],
            'second_name': player['second_name'],
            'team': player['team'],
            'photo': player['photo'],
            'web_name': player['web_name'],
            'now_cost': player['now_cost'],
            'total_points': player['total_points'],
            'goals_scored': player['goals_scored'],
            'assists': player['assists'],
            'clean_sheets': player['clean_sheets'],
            'starts': player['starts'],
            'selected_by_percent': player['selected_by_percent'],
            'points_per_game': player['points_per_game'],
        }
        for player in bootstrap_static_data['elements']
    ]
    return render_template('compare.html', players=players, teams=teams)

@app.route('/api/player/<int:player_id>', methods=['GET'])
def api_player(player_id):
    player = next((player for player in players if player['id'] == player_id), None)
    if player:
        player['photo'] = f"p{player['photo'].replace('.jpg', '')}.png"
        return jsonify(player)
    else:
        return jsonify({'error': 'Player not found'}), 404

@app.route('/api/user/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user_data = get_user_data(user_id)
    if user_data:
        return jsonify(user_data)
    else:
        return jsonify({'error': 'User not found'}), 404

@app.route('/squad')
def squad_page():
    return render_template('squad.html')

@app.route('/api/squad/<int:team_id>', methods=['GET'])
def get_squad(team_id):
    try:
        user_data_response = requests.get(f"{ENTRY_URL}{team_id}/")
        user_data_response.raise_for_status()
        user_data = user_data_response.json()

        manager_name = f"{user_data['player_first_name']} {user_data['player_last_name']}"
        team_name = user_data['name']

        history_response = requests.get(f"{ENTRY_URL}{team_id}/history/")
        history_response.raise_for_status()
        history_data = history_response.json()
        latest_event = history_data['current'][-1]['event']

        response = requests.get(f"{ENTRY_URL}{team_id}/event/{latest_event}/picks/")
        response.raise_for_status()
        squad_data = response.json()

        live_response = requests.get(f"{BASE_URL}event/{latest_event}/live/")
        live_response.raise_for_status()
        live_data = live_response.json()

        players = []
        for pick in squad_data['picks']:
            player = next(p for p in bootstrap_static_data['elements'] if p['id'] == pick['element'])
            player_points = live_data['elements'][player['id'] - 1]['stats']['total_points']
            players.append({
                'name': player['web_name'],
                'photo': f"https://resources.premierleague.com/premierleague/photos/players/110x140/p{player['photo'].replace('.jpg', '')}.png",
                'points': player_points,
                'position': element_types[player['element_type']],
                'is_bench': pick['multiplier'] == 0,
                'is_captain': pick['is_captain']
            })

        return jsonify({
            'manager_name': manager_name,
            'team_name': team_name,
            'players': players
        })
    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching squad data: {e}")
        return jsonify({"error": "Failed to fetch squad data"}), 500

@app.route('/api/optimize/<int:team_id>', methods=['GET'])
def optimize_squad(team_id):
    try:
        history_response = requests.get(f"{ENTRY_URL}{team_id}/history/")
        history_response.raise_for_status()
        history_data = history_response.json()
        latest_event = history_data['current'][-1]['event']

        response = requests.get(f"{ENTRY_URL}{team_id}/event/{latest_event}/picks/")
        response.raise_for_status()
        squad_data = response.json()

        live_response = requests.get(f"{BASE_URL}event/{latest_event}/live/")
        live_response.raise_for_status()
        live_data = live_response.json()

        suggestions = []
        suggested_out_ids = set()
        suggested_in_ids = set()
        total_out_cost = 0
        total_in_cost = 0

        # Score and rank players based on the comprehensive algorithm
        all_players = bootstrap_static_data['elements']
        all_players_scores = {player['id']: score_player(player) for player in all_players}

        for pick in squad_data['picks']:
            player = next(p for p in bootstrap_static_data['elements'] if p['id'] == pick['element'])
            player_points = live_data['elements'][player['id'] - 1]['stats']['total_points']

            if player_points <= 2 and player['id'] not in suggested_out_ids:
                same_position_players = [
                    p for p in all_players
                    if p['element_type'] == player['element_type']
                    and p['id'] not in suggested_in_ids
                    and p['id'] not in suggested_out_ids
                ]
                same_position_players = sorted(same_position_players, key=lambda x: all_players_scores[x['id']], reverse=True)
                
                if same_position_players:
                    best_player = same_position_players[0]
                    suggested_out_ids.add(player['id'])
                    suggested_in_ids.add(best_player['id'])
                    total_out_cost += player['now_cost'] / 10.0
                    total_in_cost += best_player['now_cost'] / 10.0
                    suggestions.append({
                        'out': {
                            'name': player['web_name'],
                            'photo': f"https://resources.premierleague.com/premierleague/photos/players/110x140/p{player['photo'].replace('.jpg', '')}.png",
                            'cost': player['now_cost'] / 10.0
                        },
                        'in': {
                            'name': best_player['web_name'],
                            'photo': f"https://resources.premierleague.com/premierleague/photos/players/110x140/p{best_player['photo'].replace('.jpg', '')}.png",
                            'cost': best_player['now_cost'] / 10.0
                        }
                    })

        # Return top 3 suggestions with total costs
        return jsonify({
            'suggestions': suggestions[:3],
            'total_out_cost': total_out_cost,
            'total_in_cost': total_in_cost
        })
    except requests.exceptions.RequestException as e:
        logging.error(f"Error optimizing squad: {e}")
        return jsonify({"error": "Failed to optimize squad"}), 500

@app.route('/api/optimize-full/<int:team_id>', methods=['GET'])
def optimize_full_squad(team_id):
    try:
        history_response = requests.get(f"{ENTRY_URL}{team_id}/history/")
        history_response.raise_for_status()
        history_data = history_response.json()
        latest_event = history_data['current'][-1]['event']

        response = requests.get(f"{ENTRY_URL}{team_id}/event/{latest_event}/picks/")
        response.raise_for_status()
        squad_data = response.json()

        live_response = requests.get(f"{BASE_URL}event/{latest_event}/live/")
        live_response.raise_for_status()
        live_data = live_response.json()

        suggestions = []
        suggested_out_ids = set()
        suggested_in_ids = set()
        total_out_cost = 0
        total_in_cost = 0
        budget = 0

        # Score and rank players based on the comprehensive algorithm
        all_players = bootstrap_static_data['elements']
        all_players_scores = {player['id']: score_player(player) for player in all_players}

        for pick in squad_data['picks']:
            player = next(p for p in bootstrap_static_data['elements'] if p['id'] == pick['element'])
            player_points = live_data['elements'][player['id'] - 1]['stats']['total_points']

            same_position_players = [
                p for p in all_players
                if p['element_type'] == player['element_type']
                and p['id'] not in suggested_in_ids
                and p['id'] not in suggested_out_ids
            ]
            same_position_players = sorted(same_position_players, key=lambda x: all_players_scores[x['id']], reverse=True)
            
            if same_position_players:
                best_player = same_position_players[0]
                suggested_out_ids.add(player['id'])
                suggested_in_ids.add(best_player['id'])
                total_out_cost += player['now_cost'] / 10.0
                total_in_cost += best_player['now_cost'] / 10.0
                budget += best_player['now_cost'] / 10.0

                if budget > 100.0:
                    break

                suggestions.append({
                    'out': {
                        'name': player['web_name'],
                        'photo': f"https://resources.premierleague.com/premierleague/photos/players/110x140/p{player['photo'].replace('.jpg', '')}.png",
                        'cost': player['now_cost'] / 10.0
                    },
                    'in': {
                        'name': best_player['web_name'],
                        'photo': f"https://resources.premierleague.com/premierleague/photos/players/110x140/p{best_player['photo'].replace('.jpg', '')}.png",
                        'cost': best_player['now_cost'] / 10.0
                    }
                })

        # Return suggestions with total costs
        return jsonify({
            'suggestions': suggestions,
            'total_out_cost': total_out_cost,
            'total_in_cost': total_in_cost
        })
    except requests.exceptions.RequestException as e:
        logging.error(f"Error optimizing squad: {e}")
        return jsonify({"error": "Failed to optimize squad"}), 500

@app.route('/players')
def players_page():
    players = get_player_details()
    players = sorted(players, key=lambda x: x['total_points'], reverse=True)  # Sort by highest total points
    return render_template('players.html', players=players)

@app.route('/api/players/<int:page>', methods=['GET'])
def api_players_page(page):
    players = get_player_details()
    players = sorted(players, key=lambda x: x['total_points'], reverse=True)  # Sort by highest total points
    start = (page - 1) * 50
    end = start + 50
    paginated_players = players[start:end]
    return jsonify(paginated_players)

@app.route('/league')
def league_page():
    return render_template('league.html')

LEAGUE_IDS = {
    "Div A": 446714,
    "Div B": 446717,
    "Div C": 446720,
    "Div D": 446723,
    "Div E": 446724,
    "Div F": 446727,
}

@app.route('/api/leagues', methods=['GET'])
def get_all_leagues_data():
    league_data = {}
    try:
        for name, league_id in LEAGUE_IDS.items():
            response = requests.get(f"https://fantasy.premierleague.com/api/leagues-h2h/{league_id}/standings/?page_new_entries=1&page_standings=1")
            response.raise_for_status()
            league_data[name] = response.json()
        app.logger.debug("All league data fetched: %s", league_data)
        return jsonify(league_data)
    except requests.exceptions.RequestException as e:
        app.logger.error(f"Error fetching league data: {e}")
        return jsonify({"error": "Failed to fetch league data"}), 500
    
@app.route('/api/fixtures/<int:event>', methods=['GET'])
def get_fixtures_for_event(event):
    try:
        response = requests.get(f"{FIXTURES_URL}?event={event}")
        response.raise_for_status()
        fixtures = response.json()

        fixture_list = [{
            'home_team': teams[fixture['team_h']],
            'away_team': teams[fixture['team_a']],
            'home_score': fixture.get('team_h_score'),
            'away_score': fixture.get('team_a_score'),
            'finished': fixture['finished'],
            'event': fixture['event']
        } for fixture in fixtures]

        return jsonify(fixture_list)

    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching fixtures for event {event}: {e}")
        return jsonify({"error": "Failed to fetch fixtures"}), 500

@app.route('/api/highest_scorers/<int:gameweek>', methods=['GET'])
def get_highest_scorers(gameweek):
    highest_scorers = {}
    try:
        for name, league_id in LEAGUE_IDS.items():
            response = requests.get(f"https://fantasy.premierleague.com/api/leagues-h2h-matches/league/{league_id}/?page=1&event={gameweek}")
            response.raise_for_status()
            league_data = response.json()
            matches = league_data['results']
            highest_score = 0
            highest_scorer_entries = []

            for match in matches:
                entry_1_points = match['entry_1_points']
                entry_2_points = match['entry_2_points']

                if entry_1_points > highest_score:
                    highest_score = entry_1_points
                    highest_scorer_entries = [match['entry_1_player_name']]
                elif entry_1_points == highest_score:
                    highest_scorer_entries.append(match['entry_1_player_name'])

                if entry_2_points > highest_score:
                    highest_score = entry_2_points
                    highest_scorer_entries = [match['entry_2_player_name']]
                elif entry_2_points == highest_score:
                    highest_scorer_entries.append(match['entry_2_player_name'])

            highest_scorers[name] = {
                "score": highest_score,
                "players": highest_scorer_entries
            }

        return jsonify(highest_scorers)
    except requests.exceptions.RequestException as e:
        app.logger.error(f"Error fetching highest scorers: {e}")
        return jsonify({"error": "Failed to fetch highest scorers"}), 500
    except Exception as e:
        app.logger.error(f"Unexpected error: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500

@app.route('/fixtures')
def fixtures_page():
    return render_template('fixtures.html')

FIXTURES_URL = "https://fantasy.premierleague.com/api/fixtures/"
BOOTSTRAP_STATIC_URL = "https://fantasy.premierleague.com/api/bootstrap-static/"

@app.route('/api/fixtures', methods=['GET'])
def get_fixtures():
    fixtures = requests.get(FIXTURES_URL).json()
    teams_data = requests.get(BOOTSTRAP_STATIC_URL).json()['teams']
    teams = {team['id']: {'name': team['name'], 'short_name': team['short_name']} for team in bootstrap_static_data['teams']}
    
    for fixture in fixtures:
        fixture['home_team'] = teams.get(fixture['team_h'], {})
        fixture['away_team'] = teams.get(fixture['team_a'], {})
        # fixture['home_team_logo'] = f"https://resources.premierleague.com/premierleague/badges/50/t{fixture['team_h']}.png"
        # fixture['away_team_logo'] = f"https://resources.premierleague.com/premierleague/badges/50/t{fixture['team_a']}.png"
    return jsonify(fixtures)

@app.route('/api/match_details/<int:fixture_id>', methods=['GET'])
def get_match_details(fixture_id):
    fixture_details = requests.get(f"{FIXTURES_URL}/{fixture_id}").json()
    details = {
        "goal_scorers": [],
        "assists": [],
        "yellow_cards": [],
        "red_cards": []
    }
    for event in fixture_details.get('stats', []):
        for player_event in event['h']:
            player_id = player_event['element']
            if event['identifier'] == 'goals_scored':
                details['goal_scorers'].append(player_id)
            elif event['identifier'] == 'assists':
                details['assists'].append(player_id)
            elif event['identifier'] == 'yellow_cards':
                details['yellow_cards'].append(player_id)
            elif event['identifier'] == 'red_cards':
                details['red_cards'].append(player_id)
        for player_event in event['a']:
            player_id = player_event['element']
            if event['identifier'] == 'goals_scored':
                details['goal_scorers'].append(player_id)
            elif event['identifier'] == 'assists':
                details['assists'].append(player_id)
            elif event['identifier'] == 'yellow_cards':
                details['yellow_cards'].append(player_id)
            elif event['identifier'] == 'red_cards':
                details['red_cards'].append(player_id)

    return jsonify(details)

@app.route('/whatif')
def whatif_page():
    return render_template('whatif.html')

@app.route('/api/whatif/<int:team_id>', methods=['GET'])
def get_whatif_points(team_id):
    try:
        # Fetch initial squad and captain from Gameweek 1
        initial_squad_response = requests.get(f"{ENTRY_URL}{team_id}/event/1/picks/")
        initial_squad_response.raise_for_status()
        initial_squad = initial_squad_response.json()['picks']
        initial_squad_ids = [player['element'] for player in initial_squad]
        initial_captain_id = next(player['element'] for player in initial_squad if player['is_captain'])

        # Fetch gameweek history to iterate over each gameweek
        history_response = requests.get(f"{ENTRY_URL}{team_id}/history/")
        history_response.raise_for_status()
        history_data = history_response.json()

        # Fetch manager and team name
        user_data = get_user_data(team_id)
        manager_name = f"{user_data['player_first_name']} {user_data['player_last_name']}"
        team_name = user_data['name']

        total_points = 0
        squad_points = {player_id: 0 for player_id in initial_squad_ids}

        # Calculate points for each gameweek as if no changes were made
        for event in history_data['current']:
            event_id = event['event']
            event_data_response = requests.get(f"{BASE_URL}event/{event_id}/live/")
            event_data_response.raise_for_status()
            event_data = event_data_response.json()

            event_points = 0

            for player_id in initial_squad_ids:
                player_data = event_data['elements'][player_id - 1]
                player_points = player_data['stats']['total_points']
                event_points += player_points
                squad_points[player_id] += player_points

            # Add points for the captain
            captain_data = event_data['elements'][initial_captain_id - 1]
            captain_points = captain_data['stats']['total_points']
            event_points += captain_points  # Double counting for captaincy
            squad_points[initial_captain_id] += captain_points

            total_points += event_points

        # Prepare the squad details with total points, positions, photos, and captain status
        position_mapping = {
            "GKP": "GK",
            "DEF": "DEF",
            "MID": "MID",
            "FWD": "FWD"
        }
        squad_details = []
        for player in initial_squad:
            player_id = player['element']
            player_info = next((p for p in players if p['id'] == player_id), {})
            player_name = player_info.get('web_name', 'Unknown')
            player_position = position_mapping.get(element_types.get(player_info.get('element_type')), 'Unknown')
            is_bench = player['multiplier'] == 0
            player_photo = player_info.get('photo', '').replace('.jpg', '')
            is_captain = player['is_captain']
            squad_details.append({
                "name": player_name,
                "total_points": squad_points[player_id],
                "position": player_position,
                "is_bench": is_bench,
                "photo": player_photo,
                "is_captain": is_captain
            })

        return jsonify({
            "points": total_points,
            "squad": squad_details,
            "manager_name": manager_name,
            "team_name": team_name
        })
    except Exception as e:
        app.logger.error(f"Error calculating what if points for team {team_id}: {e}")
        return jsonify({"error": "Failed to calculate what if points"}), 500

@app.route('/api/classic-standings', methods=['GET'])
def get_classic_standings():
    try:
        response = requests.get('https://fantasy.premierleague.com/api/leagues-classic/420585/standings/')
        response.raise_for_status()
        data = response.json()
        standings = data['standings']['results']
        simplified_standings = [
            {
                'entry_name': entry['entry_name'],
                'player_name': entry['player_name'],
                'rank_sort': entry['rank_sort'],
                'total': entry['total']
            }
            for entry in standings
        ]
        return jsonify(simplified_standings)
    except requests.exceptions.RequestException as e:
        return jsonify({"error": "Failed to fetch classic standings"}), 500

@app.route('/api/ultimate-standings', methods=['GET'])
def get_ultimate_standings():
    try:
        response = requests.get('https://fantasy.premierleague.com/api/leagues-classic/420581/standings/')
        response.raise_for_status()
        data = response.json()
        standings = data['standings']['results']
        simplified_standings = [
            {
                'entry_name': entry['entry_name'],
                'player_name': entry['player_name'],
                'rank_sort': entry['rank_sort'],
                'total': entry['total']
            }
            for entry in standings
        ]
        return jsonify(simplified_standings)
    except requests.exceptions.RequestException as e:
        return jsonify({"error": "Failed to fetch ultimate standings"}), 500


def get_user_data(user_id):
    try:
        response = requests.get(f"{ENTRY_URL}{user_id}/")
        response.raise_for_status()
        user_data = response.json()
        user_data['favourite_team_name'] = teams.get(user_data['favourite_team'], "N/A")
        user_data['favourite_team_logo'] = f"//resources.premierleague.com/premierleague/badges/t{user_data['favourite_team']}.png"
        user_data['region_flag'] = f"https://fantasy.premierleague.com/img/flags/{user_data['player_region_iso_code_short']}.gif"
        return user_data
    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching user data: {e}")
        return {}

def get_gameweek_history(user_id):
    try:
        response = requests.get(f"{ENTRY_URL}{user_id}/history/")
        response.raise_for_status()
        data = response.json()

        chips = {chip['event']: chip['name'] for chip in data['chips']}
        total_bench_points = 0
        total_max_captain_points = 0

        for event in data['current']:
            event['chip'] = chips.get(event['event'], '')

            event_details = requests.get(f"{ENTRY_URL}{user_id}/event/{event['event']}/picks/")
            event_details.raise_for_status()
            event_details_data = event_details.json()

            live_data = requests.get(f"{BASE_URL}event/{event['event']}/live/")
            live_data.raise_for_status()
            live_data_points = live_data.json()

            bench_points = sum(
                live_data_points['elements'][player['element'] - 1]['stats']['total_points']
                for player in event_details_data['picks'] if player['multiplier'] == 0
            )
            event['bench_points'] = bench_points
            total_bench_points += bench_points

            max_points = max(
                live_data_points['elements'][player['element'] - 1]['stats']['total_points']
                for player in event_details_data['picks']
            )
            actual_captain_points = next(
                live_data_points['elements'][player['element'] - 1]['stats']['total_points']
                for player in event_details_data['picks'] if player['is_captain']
            )
            total_max_captain_points += max_points - actual_captain_points

            entry_history = event_details_data['entry_history']
            event['bank'] = entry_history['bank'] / 10.0
            event['value'] = entry_history['value'] / 10.0

        data['total_bench_points'] = total_bench_points
        data['total_max_captain_points'] = total_max_captain_points

        return data
    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching gameweek history: {e}")
        return {}

def get_best_and_worst_gameweeks(gameweek_history):
    current_gameweeks = gameweek_history['current']
    best_gameweeks = []
    worst_gameweeks = []
    max_points = max(gameweek['points'] for gameweek in current_gameweeks)
    min_points = min(gameweek['points'] for gameweek in current_gameweeks)
    
    for gameweek in current_gameweeks:
        if (gameweek['points'] == max_points):
            best_gameweeks.append(gameweek)
        if (gameweek['points'] == min_points):
            worst_gameweeks.append(gameweek)
    
    return best_gameweeks, worst_gameweeks

def get_transfers(user_id):
    try:
        response = requests.get(f"{ENTRY_URL}{user_id}/transfers/")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching transfers: {e}")
        return []

def group_transfers_by_event(transfers):
    grouped = defaultdict(list)
    for transfer in transfers:
        grouped[transfer['event']].append(transfer)
    return dict(grouped)

def get_player_details():
    api_url = "https://fantasy.premierleague.com/api/bootstrap-static/"
    response = requests.get(api_url).json()
    teams = {team['code']: team['name'] for team in response['teams']}
    element_types = {element['id']: element['plural_name_short'] for element in response['element_types']}
    players = response['elements']
    
    player_details = []
    for player in players:
        player_details.append({
            "team_name": teams.get(player['team_code'], "Unknown"),
            "photo": f"https://resources.premierleague.com/premierleague/photos/players/110x140/p{player['photo'].replace('.jpg', '')}.png",
            "web_name": player['web_name'],
            "first_name": player['first_name'],
            "second_name": player['second_name'],
            "now_cost": player['now_cost'] / 10.0,
            "points_per_game": player['points_per_game'],
            "total_points": player['total_points'],
            "goals_scored": player['goals_scored'],
            "assists": player['assists'],
            "clean_sheets": player['clean_sheets'],
            "starts": player['starts'],
            "selected_by_percent": player['selected_by_percent'],
            "element_type": element_types.get(player['element_type'], "Unknown"),
            "goals_conceded": player['goals_conceded'],
            "own_goals": player['own_goals'],
            "penalties_saved": player['penalties_saved'],
            "penalties_missed": player['penalties_missed'],
            "yellow_cards": player['yellow_cards'],
            "red_cards": player['red_cards'],
            "saves": player['saves'],
            "bonus": player['bonus']
        })
    return player_details

def get_most_selected_player(user_id):
    try:
        response = requests.get(f"{ENTRY_URL}{user_id}/history/")
        response.raise_for_status()
        history_data = response.json()
        
        picks = defaultdict(int)
        for event in history_data['current']:
            event_details = requests.get(f"{ENTRY_URL}{user_id}/event/{event['event']}/picks/")
            event_details.raise_for_status()
            event_details_data = event_details.json()

            for player in event_details_data['picks']:
                picks[player['element']] += 1

        most_selected_player_id = max(picks, key=picks.get)
        most_selected_player = next((player for player in players if player['id'] == most_selected_player_id), None)
        
        if most_selected_player:
            most_selected_player['photo'] = f"https://resources.premierleague.com/premierleague/photos/players/110x140/p{most_selected_player['photo'].replace('.jpg', '')}.png"
            most_selected_player['count'] = picks[most_selected_player_id]
            return most_selected_player
        else:
            return {}
    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching most selected player: {e}")
        return {}

@app.route('/history')
def history_page():
    return render_template('history.html')

@app.route('/api/history/<int:team_id>', methods=['GET'])
def get_history(team_id):
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))

        # Fetch user data
        user_response = requests.get(f"{ENTRY_URL}{team_id}/")
        user_response.raise_for_status()
        user_data = user_response.json()
        manager_name = f"{user_data['player_first_name']} {user_data['player_last_name']}"
        team_name = user_data['name']
        region = user_data['player_region_name']
        favourite_team = teams.get(user_data['favourite_team'], "N/A")
        total_points = user_data['summary_overall_points']
        rank = user_data['summary_overall_rank']

        # Fetch history data
        history_response = requests.get(f"{ENTRY_URL}{team_id}/history/")
        history_response.raise_for_status()
        data = history_response.json()
        
        # Get chips used
        chips_used = {chip['event']: chip['name'] for chip in data['chips']}
        
        history = []
        best_gameweeks = []
        worst_gameweeks = []
        max_points = -1
        min_points = float('inf')
        total_bench_points = 0

        for event in data['current']:
            gameweek_data = {
                "Gameweek": event['event'],
                "Points": event['points'],
                "Overall Rank": event['overall_rank'],
                "Points on Bench": event['points_on_bench'],
                "Bank": event['bank'] / 10.0,
                "Value": event['value'] / 10.0,
                "Chips Used": chips_used.get(event['event'], "")
            }

            history.append(gameweek_data)
            total_bench_points += event['points_on_bench']

            # Determine best and worst gameweeks
            if event['points'] > max_points:
                max_points = event['points']
                best_gameweeks = [gameweek_data]
            elif event['points'] == max_points:
                best_gameweeks.append(gameweek_data)

            if event['points'] < min_points:
                min_points = event['points']
                worst_gameweeks = [gameweek_data]
            elif event['points'] == min_points:
                worst_gameweeks.append(gameweek_data)

        # Pagination
        total_items = len(history)
        total_pages = (total_items + per_page - 1) // per_page
        start = (page - 1) * per_page
        end = start + per_page
        paginated_history = history[start:end]
        
        # Fetch most selected player
        picks = defaultdict(int)
        for event in data['current']:
            event_details_response = requests.get(f"{ENTRY_URL}{team_id}/event/{event['event']}/picks/")
            event_details_response.raise_for_status()
            event_details = event_details_response.json()
            for player in event_details['picks']:
                picks[player['element']] += 1

        most_selected_player_id = max(picks, key=picks.get)
        most_selected_player = next((player for player in players if player['id'] == most_selected_player_id), {})
        
        most_selected_player_info = {
            "name": most_selected_player.get('web_name', 'Unknown'),
            "photo": f"https://resources.premierleague.com/premierleague/photos/players/110x140/p{most_selected_player.get('photo', '').replace('.jpg', '')}.png",
            "count": picks[most_selected_player_id]
        }
        
        return jsonify({
            "manager_name": manager_name,
            "team_name": team_name,
            "region": region,
            "favourite_team": favourite_team,
            "total_points": total_points,
            "rank": rank,
            "history": paginated_history,
            "most_selected_player": most_selected_player_info,
            "best_gameweeks": best_gameweeks,
            "worst_gameweeks": worst_gameweeks,
            "total_bench_points": total_bench_points,  # Add total bench points here
            "current_page": page,
            "total_pages": total_pages
        })
    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching history for team {team_id}: {e}")
        return jsonify({"error": "Failed to fetch history"}), 500

@app.route('/api/transfers/<int:team_id>', methods=['GET'])
def get_transfers_data(team_id):
    try:
        response = requests.get(f"{ENTRY_URL}{team_id}/transfers/")
        response.raise_for_status()
        transfers_data = response.json()
        
        # Get player details
        player_details = {player['id']: player for player in bootstrap_static_data['elements']}

        # Format the transfers data
        formatted_transfers = []
        for transfer in transfers_data:
            element_in = player_details.get(transfer['element_in'], {})
            element_out = player_details.get(transfer['element_out'], {})
            
            formatted_transfers.append({
                "gameweek": transfer['event'],
                "transfer_in": {
                    "id": element_in.get('id', ''),
                    "name": element_in.get('web_name', ''),
                    "photo": f"https://resources.premierleague.com/premierleague/photos/players/110x140/p{element_in.get('photo', '').replace('.jpg', '')}.png"
                },
                "price_in": transfer['element_in_cost'] / 10.0,
                "transfer_out": {
                    "id": element_out.get('id', ''),
                    "name": element_out.get('web_name', ''),
                    "photo": f"https://resources.premierleague.com/premierleague/photos/players/110x140/p{element_out.get('photo', '').replace('.jpg', '')}.png"
                },
                "price_out": transfer['element_out_cost'] / 10.0
            })

        return jsonify(formatted_transfers)
    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching transfers data: {e}")
        return jsonify({"error": "Failed to fetch transfers data"}), 500
    
@app.route('/otw')
def otw_page():
    players_sorted = sorted(bootstrap_static_data['elements'], key=lambda x: (
        x['goals_scored'],
        x['assists'],
        x['clean_sheets'],
        float(x.get('influence', 0) or 0),
        float(x.get('creativity', 0) or 0),
        float(x.get('threat', 0) or 0),
        float(x.get('value_form', 0) or 0),
        x['cost_change_start'],
        float(x.get('points_per_game', 0) or 0),
        float(x.get('selected_by_percent', 0) or 0),
        x['starts'],
        float(x.get('expected_goals', 0) or 0),
        float(x.get('expected_assists', 0) or 0),
        float(x.get('expected_goal_involvements', 0) or 0)
    ), reverse=True)

    top_10_goals_scored = sorted(players_sorted, key=lambda x: x['goals_scored'], reverse=True)[:10]
    top_10_assists = sorted(players_sorted, key=lambda x: x['assists'], reverse=True)[:10]
    top_10_clean_sheets = sorted([p for p in players_sorted if p['element_type'] == 1], key=lambda x: x['clean_sheets'], reverse=True)[:10]
    top_10_influence = sorted(players_sorted, key=lambda x: float(x.get('influence', 0) or 0), reverse=True)[:10]
    top_10_creativity = sorted(players_sorted, key=lambda x: float(x.get('creativity', 0) or 0), reverse=True)[:10]
    top_10_threat = sorted(players_sorted, key=lambda x: float(x.get('threat', 0) or 0), reverse=True)[:10]
    top_10_value_form = sorted(players_sorted, key=lambda x: float(x.get('value_form', 0) or 0), reverse=True)[:10]
    top_10_cost_change = sorted(players_sorted, key=lambda x: x['cost_change_start'], reverse=True)[:10]
    top_10_points_per_game = sorted(players_sorted, key=lambda x: float(x.get('points_per_game', 0) or 0), reverse=True)[:10]
    top_10_selected_by_percent = sorted(players_sorted, key=lambda x: float(x.get('selected_by_percent', 0) or 0), reverse=True)[:10]
    top_10_starts = sorted(players_sorted, key=lambda x: x['starts'], reverse=True)[:10]
    top_10_expected_goals = sorted(players_sorted, key=lambda x: float(x.get('expected_goals', 0) or 0), reverse=True)[:10]
    top_10_expected_assists = sorted(players_sorted, key=lambda x: float(x.get('expected_assists', 0) or 0), reverse=True)[:10]
    top_10_expected_goal_involvements = sorted(players_sorted, key=lambda x: float(x.get('expected_goal_involvements', 0) or 0), reverse=True)[:10]

    return render_template('otw.html', 
                           top_10_goals_scored=top_10_goals_scored,
                           top_10_assists=top_10_assists,
                           top_10_clean_sheets=top_10_clean_sheets,
                           top_10_influence=top_10_influence,
                           top_10_creativity=top_10_creativity,
                           top_10_threat=top_10_threat,
                           top_10_value_form=top_10_value_form,
                           top_10_cost_change=top_10_cost_change,
                           top_10_points_per_game=top_10_points_per_game,
                           top_10_selected_by_percent=top_10_selected_by_percent,
                           top_10_starts=top_10_starts,
                           top_10_expected_goals=top_10_expected_goals,
                           top_10_expected_assists=top_10_expected_assists,
                           top_10_expected_goal_involvements=top_10_expected_goal_involvements)

BASE_URL = "https://fantasy.premierleague.com/api/"

def get_bootstrap_static_data():
    response = requests.get(f"{BASE_URL}bootstrap-static/")
    response.raise_for_status()
    return response.json()

@app.route('/api/captaincy_suggestions', methods=['GET'])
def get_captaincy_suggestions():
    try:
        # Fetch the upcoming fixtures
        fixtures = requests.get(FIXTURES_URL).json()

        def get_next_fixture(player_team_id):
            for fixture in fixtures:
                if fixture['team_h'] == player_team_id:
                    opponent_id = fixture['team_a']
                    return f"{teams[opponent_id]} (Home)"
                elif fixture['team_a'] == player_team_id:
                    opponent_id = fixture['team_h']
                    return f"{teams[opponent_id]} (Away)"

        def captaincy_score(player):
            score = (float(player['points_per_game']) * 0.4 +
                     float(player['form']) * 0.3 +
                     float(player['goals_scored']) * 0.15 +
                     float(player['assists']) * 0.1 +
                     float(player['expected_goal_involvements_per_90']) * 0.05)
            return score

        # Calculate scores for all players
        player_scores = [
            {
                'id': player['id'],
                'name': player['web_name'],
                'team': teams[player['team']],
                'cost': player['now_cost'] / 10.0,
                'next_fixture': get_next_fixture(player['team']),
                'photo': f"https://resources.premierleague.com/premierleague/photos/players/110x140/p{player['photo'].replace('.jpg', '')}.png",
                'captaincy_score': captaincy_score(player)
            }
            for player in players
        ]

        # Sort players by captaincy score
        player_scores.sort(key=lambda x: x['captaincy_score'], reverse=True)

        # Select the top 3 players as captaincy suggestions
        captaincy_suggestions = player_scores[:3]
        return jsonify(captaincy_suggestions)

    except Exception as e:
        logging.error(f"Error fetching captaincy suggestions: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

# @app.route('/captaincy_suggestions')
# def captaincy_suggestions_page():
#     return render_template('captaincy_suggestions.html')
#app = Flask(__name__)

BASE_URL = "https://fantasy.premierleague.com/api/"

def fetch_data(endpoint):
    response = requests.get(f"{BASE_URL}{endpoint}")
    response.raise_for_status()
    return response.json()

@app.route('/api/player_data', methods=['GET'])
def get_player_data():
    data = fetch_data("bootstrap-static/")
    players = data['elements']
    teams = {team['id']: team['name'] for team in data['teams']}
    positions = {1: 'GK', 2: 'DEF', 3: 'MID', 4: 'FWD'}
    for player in players:
        player['team_name'] = teams[player['team']]
        player['element_type'] = positions[player['element_type']]
        player['photo'] = f"https://resources.premierleague.com/premierleague/photos/players/110x140/p{player['photo'].replace('.jpg', '')}.png"
    return jsonify(players)


@app.route('/prediction')
def prediction_page():
    return render_template('prediction.html')
    
@app.route('/division-allocation')
def division_allocation():
    try:
        sheet_urls = {
            'Div_A': 'https://docs.google.com/spreadsheets/d/1wgPqLkxPnIgv7TxpppFxZ-_5p3AR8i29pcn7LI8jsD8/export?format=csv&gid=104567074',
            'Div_B': 'https://docs.google.com/spreadsheets/d/1wgPqLkxPnIgv7TxpppFxZ-_5p3AR8i29pcn7LI8jsD8/export?format=csv&gid=311233695',
            'Div_C': 'https://docs.google.com/spreadsheets/d/1wgPqLkxPnIgv7TxpppFxZ-_5p3AR8i29pcn7LI8jsD8/export?format=csv&gid=825469925',
            'Div_D': 'https://docs.google.com/spreadsheets/d/1wgPqLkxPnIgv7TxpppFxZ-_5p3AR8i29pcn7LI8jsD8/export?format=csv&gid=1483351494',
            'Div_E': 'https://docs.google.com/spreadsheets/d/1wgPqLkxPnIgv7TxpppFxZ-_5p3AR8i29pcn7LI8jsD8/export?format=csv&gid=39659398',
            'Div_F': 'https://docs.google.com/spreadsheets/d/1wgPqLkxPnIgv7TxpppFxZ-_5p3AR8i29pcn7LI8jsD8/export?format=csv&gid=730642084',
        }
        filtered_data = {}

        for sheet, url in sheet_urls.items():
            # Fetch the CSV data from the hardcoded URL
            df_sheet = pd.read_csv(url)

            # Clean the column names
            df_sheet.columns = df_sheet.columns.str.strip()

            if 'Name' not in df_sheet.columns:
                return render_template('error.html', message=f"Column 'Name' not found in sheet {sheet}")

            filtered_data[sheet] = df_sheet[['Name']]
        
        return render_template('division_allocation.html', data=filtered_data)
    except Exception as e:
        logging.error(f"Error fetching Division Allocation data: {e}")
        return render_template('error.html', message="Failed to load Division Allocation data.")


@app.route('/api/players', methods=['GET'])
def get_players():
    try:
        players = bootstrap_static_data['elements']
        player_data = [{
            'id': player['id'],
            'web_name': player['web_name'],
            'photo': f"https://resources.premierleague.com/premierleague/photos/players/110x140/p{player['photo'].replace('.jpg', '')}.png",
            'position': element_types[player['element_type']]
        } for player in players]
        return jsonify(player_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

if __name__ == '__main__':
    app.run(debug=True, port=5001)
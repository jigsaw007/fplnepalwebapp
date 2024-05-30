from flask import Flask, render_template, jsonify, request
import requests
import logging
from collections import defaultdict
from collections import Counter
from datetime import datetime
import pandas as pd
import io

app = Flask(__name__)

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

def fetch_google_sheet_data(url):
    response = requests.get(url)
    response.raise_for_status()
    data = response.content.decode('utf-8')
    df = pd.read_csv(io.StringIO(data))
    return df

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

@app.route('/')
def home():
    return render_template('index.html')

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
        gameweek_data = []
        for event_id in range(34, 39):  # Last 5 gameweeks
            response = requests.get(f"{BASE_URL}event/{event_id}/live/")
            response.raise_for_status()
            gameweek_data.append(response.json())

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


@app.route('/compare')
def compare_page():
    for player in players:
        player['team_name'] = teams.get(player['team_code'], "Unknown Team")
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

@app.route('/user/<int:user_id>')
def user_details(user_id):
    user_data = get_user_data(user_id)
    gameweek_history = get_gameweek_history(user_id)
    transfers = get_transfers(user_id)
    grouped_transfers = group_transfers_by_event(transfers)
    best_gameweeks, worst_gameweeks = get_best_and_worst_gameweeks(gameweek_history)
    most_selected_player = get_most_selected_player(user_id)
    
    return render_template('user_details.html', user_data=user_data, gameweek_history=gameweek_history, transfers=grouped_transfers, players=players, best_gameweeks=best_gameweeks, worst_gameweeks=worst_gameweeks, teams=teams, items_per_page=ITEMS_PER_PAGE, transfers_items_per_page=TRANSFERS_ITEMS_PER_PAGE, most_selected_player=most_selected_player)

@app.route('/api/gameweek_history/<int:user_id>/<int:page>', methods=['GET'])
def api_gameweek_history(user_id, page):
    gameweek_history = get_gameweek_history(user_id)['current']
    start = (page - 1) * ITEMS_PER_PAGE
    end = start + ITEMS_PER_PAGE
    paginated_history = gameweek_history[start:end]
    return jsonify(paginated_history)

@app.route('/api/transfers/<int:user_id>/<int:page>', methods=['GET'])
def api_transfers(user_id, page):
    transfers = get_transfers(user_id)
    grouped_transfers = group_transfers_by_event(transfers)
    paginated_transfers = {}
    events = list(grouped_transfers.keys())
    start = (page - 1) * TRANSFERS_ITEMS_PER_PAGE
    end = start + TRANSFERS_ITEMS_PER_PAGE
    paginated_events = events[start:end]
    for event in paginated_events:
        paginated_transfers[event] = grouped_transfers[event]
    return jsonify(paginated_transfers)

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
    "Div A": 571897,
    "Div B": 571898,
    "Div C": 571899,
    "Div D": 571902,
    "Div E": 571905,
    "Div F": 571906,
    "Div G": 571907,
    "Div H": 590971
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
        response = requests.get('https://fantasy.premierleague.com/api/leagues-classic/604351/standings/')
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
        response = requests.get('https://fantasy.premierleague.com/api/leagues-classic/345282/standings/')
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



if __name__ == "__main__":
    app.run(debug=True)

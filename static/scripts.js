$(document).ready(function() {
    

    // Functionality for highest Gameweek scorers
    function loadLeagueData() {
        $.get('/api/leagues', function(data) {
            if (data) {
                const leagueTablesContainer = $('#league-tables');
                leagueTablesContainer.empty();

                for (const [leagueName, leagueData] of Object.entries(data)) {
                    if (leagueData.standings && leagueData.standings.results) {
                        const standings = leagueData.standings.results;
                        const tableId = `league-table-${leagueName.replace(' ', '-')}`;
                        const tableHtml = `
                            <div class="col-md-6">
                                <h3>${leagueName}</h3>
                                <table class="table table-striped table-bordered" id="${tableId}">
                                    <thead class="thead-dark">
                                        <tr>
                                            <th class="rank-col">Rank</th>
                                            <th class="name-col">Name</th>
                                            <th class="matches-played-col">MP</th>
                                            <th class="matches-won-col">W</th>
                                            <th class="matches-drawn-col">D</th>
                                            <th class="matches-lost-col">L</th>
                                            <th class="points-col">Total Points</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${standings.map(entry => `
                                            <tr>
                                                <td>${entry.rank || ''}</td>
                                                <td>
                                                    ${entry.entry_name || ''}
                                                    ${entry.rank === 1 ? '<i class="fas fa-trophy trophy-icon"></i>' : ''}
                                                    <div class="player-name">${entry.player_name || ''}</div>
                                                </td>
                                                <td>${entry.matches_played || ''}</td>
                                                <td>${entry.matches_won || ''}</td>
                                                <td>${entry.matches_drawn || ''}</td>
                                                <td>${entry.matches_lost || ''}</td>
                                                <td>${entry.total || ''}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `;
                        leagueTablesContainer.append(tableHtml);
                        $(`#${tableId}`).DataTable({
                            "pageLength": 12,
                            "searching": false,
                            "ordering": false,
                            "pagingType": "simple"
                        });
                    }
                }
            } else {
                console.error("No league data found");
            }
        });
    }

    function loadGameweekOptions() {
        const gameweeks = Array.from({length: 38}, (_, i) => i + 1);
        const gameweekSelect = $('#gameweek-select');
        gameweeks.forEach(gameweek => {
            gameweekSelect.append(`<option value="${gameweek}">Gameweek ${gameweek}</option>`);
        });
    }

    function loadHighestScorers(gameweek) {
        $.get(`/api/highest_scorers/${gameweek}`, function(data) {
            const highestScorersContainer = $('#highest-scorers');
            highestScorersContainer.empty();

            for (const [leagueName, details] of Object.entries(data)) {
                const leagueHtml = `
                    <div class="highest-scorer-box">
                        <h4>${leagueName}</h4>
                        <p><strong>Highest Score:</strong> ${details.score} points</p>
                        <ul class="list-group">
                            ${details.players.map(player => `
                                <li class="list-group-item">
                                    ${player}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `;
                highestScorersContainer.append(leagueHtml);
            }
        });
    }

    $('#gameweek-select').change(function() {
        const selectedGameweek = $(this).val();
        loadHighestScorers(selectedGameweek);
    });

    loadLeagueData();
    loadGameweekOptions();
    loadHighestScorers(1); // Load highest scorers for gameweek 1 by default

    // Functionality for comparing players
    $('#compare-btn').click(function() {
        const player1Id = $('#player1-select').val();
        const player2Id = $('#player2-select').val();

        if (player1Id && player2Id) {
            $.ajax({
                url: `/api/compare/${player1Id}/${player2Id}`,
                method: 'GET',
                success: function(data) {
                    const player1 = data.player1;
                    const player2 = data.player2;
                    const comparisonResult = `
                        <div class="row">
                            <div class="col-md-6">
                                <h3>${player1.web_name}</h3>
                                <img src="${player1.photo}" class="img-fluid">
                                <ul>
                                    <li>Team: ${player1.team_name}</li>
                                    <li>Position: ${player1.element_type}</li>
                                    <li>Goals: ${player1.goals_scored}</li>
                                    <li>Assists: ${player1.assists}</li>
                                    <li>Total Points: ${player1.total_points}</li>
                                    <!-- Add other stats as needed -->
                                </ul>
                            </div>
                            <div class="col-md-6">
                                <h3>${player2.web_name}</h3>
                                <img src="${player2.photo}" class="img-fluid">
                                <ul>
                                    <li>Team: ${player2.team_name}</li>
                                    <li>Position: ${player2.element_type}</li>
                                    <li>Goals: ${player2.goals_scored}</li>
                                    <li>Assists: ${player2.assists}</li>
                                    <li>Total Points: ${player2.total_points}</li>
                                    <!-- Add other stats as needed -->
                                </ul>
                            </div>
                        </div>`;
                    $('#comparison-result').html(comparisonResult);
                },
                error: function() {
                    alert('Failed to fetch player data.');
                }
            });
        } else {
            alert('Please select two players to compare.');
        }
    });
});

/*What IF*/ 
$(document).ready(function() {
    $('#submit-btn').click(function() {
        const teamId = $('#team-id-input').val();
        if (teamId) {
            $('.overlay').show(); // Show the spinner overlay
            $.get(`/api/whatif/${teamId}`, function(data) {
                if (data.error) {
                    $('#result').html(`<div class="alert alert-danger">${data.error}</div>`);
                } else {
                    // Display team details
                    $('#team-details').html(`
                        <p class="highlight">${data.manager_name}</p>
                        <p class="highlight">${data.team_name}</p>
                    `);

                    $('#result').html(`
                        <h3>What If Points</h3>
                        <p>You would have ${data.points} points if you had never made a transfer or changed your captain since Gameweek 1.</p>
                    `);

                    const positions = {
                        "GK": [],
                        "DEF": [],
                        "MID": [],
                        "FWD": []
                    };
                    const benchPlayers = [];
                    data.squad.forEach(player => {
                        const isCaptain = player.is_captain ? '(C)' : '';
                        const playerHtml = `
                            <div class="player">
                                <img src="https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.photo.replace('.jpg', '')}.png" alt="${player.name}">
                                <strong>${player.name} ${isCaptain}</strong>
                                <div class="player-total-points">${player.total_points} points</div>
                            </div>
                        `;
                        if (player.is_bench) {
                            benchPlayers.push(`
                                <div class="bench-player">
                                    <img src="https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.photo.replace('.jpg', '')}.png" alt="${player.name}">
                                    <strong>${player.name} ${isCaptain}</strong>
                                    <div class="player-total-points">${player.total_points} points</div>
                                </div>
                            `);
                        } else if (positions[player.position]) {
                            positions[player.position].push(playerHtml);
                        }
                    });
                    $('#GK-row').html(positions.GK.join(''));
                    $('#DEF-row').html(positions.DEF.join(''));
                    $('#MID-row').html(positions.MID.join(''));
                    $('#FWD-row').html(positions.FWD.join(''));
                    $('#Bench-row').html(benchPlayers.join(''));

                    // Show formation and bench containers
                    $('.formation-container').show();
                }
                $('.overlay').hide(); // Hide the spinner overlay
            }).fail(function() {
                $('.overlay').hide(); // Hide the spinner overlay if there's an error
            });
        }
    });
});

 /*Squad Optimizer*/ 
 $(document).ready(function() {
    var teamId; // Declare a global variable to store teamId

    $('#team-form').submit(function(event) {
        event.preventDefault();
        teamId = $('#team_id').val(); // Assign the teamId to the global variable
        $('#loading-spinner').addClass('show'); // Show the spinner
        $('#loading-overlay').addClass('show'); // Show the overlay

        $.get(`/api/squad/${teamId}`, function(data) {
            $('#loading-spinner').removeClass('show'); // Hide the spinner
            $('#loading-overlay').removeClass('show'); // Hide the overlay

            if (data.error) {
                $('#team-details').html(`<div class="alert alert-danger">${data.error}</div>`);
            } else {
                $('#team-details').html(`
                    <div class="team-details-container">
                        <div class="team-name">${data.team_name}</div>
                        <div class="manager-name">${data.manager_name}</div>
                    </div>
                `);
                const positions = {
                    "GKP": [],
                    "DEF": [],
                    "MID": [],
                    "FWD": []
                };
                const benchPlayers = [];

                data.players.forEach(player => {
                    const playerHtml = `
                        <div class="player">
                            <img src="${player.photo}" alt="${player.name}">
                            <strong>${player.name} ${player.is_captain ? '(C)' : ''}</strong>
                            <div class="player-total-points">${player.points} points</div>
                        </div>
                    `;
                    if (player.is_bench) {
                        benchPlayers.push(playerHtml);
                    } else {
                        if (positions[player.position]) {
                            positions[player.position].push(playerHtml);
                        }
                    }
                });

                $('#GK-row').html(positions.GKP.join('')); // Change to GKP
                $('#DEF-row').html(positions.DEF.join(''));
                $('#MID-row').html(positions.MID.join(''));
                $('#FWD-row').html(positions.FWD.join(''));
                $('#Bench-row').html(benchPlayers.join(''));

                $('#squad-formation').show();
                $('.bench-container').show();
                $('button#optimize-btn').show();
                $('button#optimize-full-btn').show();
           
            }
        }).fail(function() {
            $('#loading-spinner').removeClass('show'); // Hide the spinner
            $('#loading-overlay').removeClass('show'); // Hide the overlay
            alert('Failed to fetch squad data.');
        });
    });

    function handleOptimization(apiEndpoint) {
        $('#loading-spinner').addClass('show'); // Show the spinner
        $('#loading-overlay').addClass('show'); // Show the overlay

        $.get(apiEndpoint, function(data) {
            $('#loading-spinner').removeClass('show'); // Hide the spinner
            $('#loading-overlay').removeClass('show'); // Hide the overlay

            if (data.error) {
                $('#suggested-transfers').html(`<div class="alert alert-danger">${data.error}</div>`);
            } else {
                const suggestionsHtml = data.suggestions.map(suggestion => `
                    <div class="suggestion">
                        <div class="player-out">
                            <h5>Out</h5>
                            <img src="${suggestion.out.photo}" alt="${suggestion.out.name}">
                            <strong>${suggestion.out.name}</strong>
                            <div class="player-cost">Cost: ${suggestion.out.cost}</div>
                        </div>
                        <div class="player-in">
                            <h5>In</h5>
                            <img src="${suggestion.in.photo}" alt="${suggestion.in.name}">
                            <strong>${suggestion.in.name}</strong>
                            <div class="player-cost">Cost: ${suggestion.in.cost}</div>
                        </div>
                    </div>
                `).join('');

                const costHtml = `
                    <div class="cost-summary">
                        <h5>Total Transfer OUT Cost: ${data.total_out_cost.toFixed(1)}</h5>
                        <h5>Total Transfer IN Cost: ${data.total_in_cost.toFixed(1)}</h5>
                    </div>
                `;

                $('#suggested-transfers').html(suggestionsHtml);
                $('#total-cost').html(costHtml); // Display the cost summary
                $('#suggestions').show();
            }
        }).fail(function() {
            $('#loading-spinner').removeClass('show'); // Hide the spinner
            $('#loading-overlay').removeClass('show'); // Hide the overlay
            alert('Failed to fetch optimization suggestions.');
        });
    }

    $('#optimize-btn').click(function() {
        handleOptimization(`/api/optimize/${teamId}`);
        $('#optimize-full-btn').prop('disabled', true);
        $('#optimize-btn').prop('disabled', false);
    });

    $('#optimize-full-btn').click(function() {
        handleOptimization(`/api/optimize-full/${teamId}`);
        $('#optimize-btn').prop('disabled', true);
        $('#optimize-full-btn').prop('disabled', false);
    });
});




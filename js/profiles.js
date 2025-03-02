const params = new URLSearchParams(document.location.search);
const profileID = params.get("id");

var deviceWidth = screen.width;

let profileIDList = [];

fetch('./profiles.json')
  .then(response => response.json())
  .then(data => {

    const profile_not_specified = document.querySelector('#profile_not_specified');
    const profile_specified = document.querySelector('#profile_specified');

    if (profileID) 
    { 
      if(data[profileID])
      {

        profile_not_specified.style.display = "none";
        profile_specified.style.display = "flex";
        var profile = data[profileID];
        document.title = `Olimpiada Karwińska - ${profile.displayed_name}`;

        document.querySelector('#profile_displayed_name').textContent = profile.displayed_name;
        document.querySelector('#profile_displayed_id').textContent = profile.id;
        document.querySelector('#profile_pfp_icon').src = `img/profiles/pfp/${profile.profile_picture.name}.${profile.profile_picture.format}`;
        document.querySelector('#profile_1st_medal_amount').textContent = profile.medals[0];
        document.querySelector('#profile_2nd_medal_amount').textContent = profile.medals[1];
        document.querySelector('#profile_3rd_medal_amount').textContent = profile.medals[2];

        var seasons = Object.keys(profile.results)
        var totalSeasons = seasons.length;
        var lastSeason = 2023+totalSeasons-1;
        var currentSeason = 2023+totalSeasons;
        
        // Show the champion badge if attended and won last season
        if (profile.results[lastSeason].attended == true && deviceWidth>768)
        {
          if (profile.results[lastSeason].position == 1)
          {
            document.querySelector('#profile_displayed_champion_badge').style.display = "flex";
          };
        };

        // Show or not the current season sections.
        if (profile.results[currentSeason].attended == true)
        {
          const current_season_position_displayed = document.querySelector('#current_season_position')
          document.querySelector('#current_season_position_section').style.display = "flex";
          document.querySelector('#current_season_not_playing').style.display = "none";
          current_season_position_displayed.textContent = `#${profile.results[currentSeason].position}`;
          document.querySelector('#current_season_points_amount').textContent = profile.results[currentSeason].total_points;

          if (profile.results[currentSeason].position == 1)
          {
            current_season_position_displayed.style.color = "var(--gold400)"
          }
          else if (profile.results[currentSeason].position == 2)
          {
            current_season_position_displayed.style.color = "var(--silver400)"
          }
          else if (profile.results[currentSeason].position == 3)
          {
            current_season_position_displayed.style.color = "var(--brown400)"
          }

        }
        else
        {
          document.querySelector('#current_season_position_section').style.display = "none";
          document.querySelector('#current_season_not_playing').style.display = "flex";
        };

        function SeasonsListCreator()
        {
          seasons = seasons.reverse();
          const seasonsList = document.getElementById('seasons_list');
          seasons.forEach(season => {

            var profileThisSeason = profile.results[season];

            if(profileThisSeason.attended == true)
            {
              const seasonItem = document.createElement('div');
              const seasonHeader = document.createElement('div');
              const seasonYear = document.createElement('div');
              const seasonLink = document.createElement('a');
              const seasonPosition = document.createElement('div');
              const seasonPoints = document.createElement('div');
              const seasonOngoing = document.createElement('div');
              const seasonOngoingIcon = document.createElement('div');
              const seasonExpandButton = document.createElement('div');
              const seasonExpandButtonImage = document.createElement('img');

              const seasonDetails = document.createElement('div');

              seasonItem.classList.add('single_season');
              seasonHeader.classList.add('single_season_header');
              seasonYear.classList.add('single_season_year');
              seasonPosition.classList.add('single_season_position');
              seasonPoints.classList.add('single_season_points');
              seasonOngoing.classList.add('single_season_ongoing');
              seasonOngoingIcon.classList.add('single_season_ongoing_icon');
              seasonExpandButton.classList.add('single_season_expand');
              seasonExpandButton.setAttribute("id", `season_expand_${season}`);
              seasonExpandButton.setAttribute("onclick", `SeasonsListExpand(${season})`);
              seasonExpandButtonImage.setAttribute("id", `season_expand_button_${season}`);

              seasonDetails.classList.add('single_season_details');
              seasonDetails.setAttribute("id", `season_details_${season}`);
              seasonOngoingIcon.setAttribute("id", `season_ongoing_${season}`);

              seasonLink.textContent = `Sezon ${season}`;
              seasonLink.href = `${season}`;
              seasonPosition.textContent = `#${profileThisSeason.position}`;
              seasonPoints.textContent = `${profileThisSeason.total_points} pkt.`;
              seasonExpandButtonImage.src = `img/profiles/expand.webp`;
              seasonOngoingIcon.textContent = `W TRAKCIE`;
              seasonOngoingIcon.style.display = `none`;

              if (profileThisSeason.position == 1)
              {
                seasonPosition.style.color = "var(--gold400)"
              }
              else if (profileThisSeason.position == 2)
              {
                seasonPosition.style.color = "var(--silver400)"
              }
              else if (profileThisSeason.position == 3)
              {
                seasonPosition.style.color = "var(--brown400)"
              }
      
              seasonsList.appendChild(seasonItem);
              seasonItem.appendChild(seasonHeader);

              seasonHeader.appendChild(seasonYear);
              seasonYear.appendChild(seasonLink);
              seasonHeader.appendChild(seasonPosition);
              seasonHeader.appendChild(seasonPoints);
              seasonHeader.appendChild(seasonOngoing);
              seasonOngoing.appendChild(seasonOngoingIcon);
              seasonHeader.appendChild(seasonExpandButton);
              seasonExpandButton.appendChild(seasonExpandButtonImage);
              
              if(season==currentSeason && profileThisSeason.finished == false)
              {
                  document.querySelector(`#season_ongoing_${season}`).style.display = "flex";
              }

              seasonItem.appendChild(seasonDetails);

              for(let i = 0; i < 4; i++){
                const seasonGame = document.createElement('div');
                const seasonGameTitle = document.createElement('div');
                const seasonGamePoints = document.createElement('div');

                seasonGame.classList.add('season_details_single_game');
                seasonGameTitle.classList.add('season_details_single_game_title');
                seasonGamePoints.classList.add('season_details_single_game_points');

                seasonGameTitle.textContent = `Gra ${i+1}`;
                if (profileThisSeason.games_points[i] != "-")
                {
                  seasonGamePoints.textContent = `${profileThisSeason.games_points[i]} pkt.`;
                }
                else
                {
                  seasonGamePoints.textContent = `${profileThisSeason.games_points[i]}`;
                }
                

                seasonDetails.appendChild(seasonGame);
                seasonGame.appendChild(seasonGameTitle);
                seasonGame.appendChild(seasonGamePoints);
              }
            }

          });
        }
        SeasonsListCreator()
      } 
      else {
        // Show when incorrect ?id= in url
        console.log("Profile ID not found in data");
      };
    } 
    else {
      profile_not_specified.style.display = "flex";
      profile_specified.style.display = "none";
      document.querySelector(`#header`).style.height = "100vh";
      console.log("Pofile ID not specified");
    };

    function profileIDListCreator()
    {
      profiles_amount = Object.keys(data).length;
      for(let i = 0; i < profiles_amount; i++){
        listObject = data[Object.keys(data)[i]];
        profileIDList.push(
          { id: listObject.id , name: listObject.displayed_name, pfp: `${listObject.profile_picture.name}.${listObject.profile_picture.format}`}
        );
      }
    }
    profileIDListCreator()

  })
  .catch(error => console.error('Error loading JSON:', error));


function SeasonsListExpand(season)
{
  season = season.toString();
  var isExpanded = false;
  const changeSeasonButton = document.querySelector(`#season_expand_button_${season}`);
  const seasonDetails =  document.querySelector(`#season_details_${season}`);

  if(changeSeasonButton.style.rotate == "180deg")
  {
    isExpanded = true;
  }

  if (isExpanded == false)
  {
    changeSeasonButton.style.rotate = "180deg";
    seasonDetails.style.display = "flex";
  }
  else
  {
    changeSeasonButton.style.rotate = "0deg";
    seasonDetails.style.display = "none";
  };
};

function performSearch() {

  const query = document.getElementById('searchBox').value.toLowerCase();
  const results = search(query);
  displayResults(results);
  
};

function search(query) {
  let searchedByName = profileIDList.filter(doc => doc.name.toLowerCase().includes(query));
  let searchedById = profileIDList.filter(doc => doc.id.toLowerCase().includes(query)); 

  let searchedByBoth = searchedByName.concat(searchedById); //Merge two searches results into one
  let results = new Set(searchedByBoth); //Removes duplicates
  
  return Array.from(results).slice(0,3); //Making it back an array and sliceing to display max 3 results
};

function displayResults(results) {
  const resultsElement = document.getElementById('results');
  const search_line = document.querySelector('#search_results_line');
  const searchbar = document.querySelector('#searchBox')
  resultsElement.innerHTML = '';
  if(document.getElementById('searchBox').value.length != 0) //If query is not empty
  {
    search_line.style.display = "flex";
    searchbar.style.borderRadius = "5pt 5pt 0pt 0pt";
    results.forEach(result => {
        const listItem = document.createElement('li');
        const listSpanName = document.createElement('span');
        const listSpanId = document.createElement('span');
        const listSpanPfp = document.createElement('img');
        const listLink = document.createElement('a');
        listSpanName.classList.add('search_result_name');
        listSpanId.classList.add('search_result_id');
        listSpanPfp.classList.add('search_result_pfp');
        listSpanName.textContent = result.name;
        listSpanId.textContent = result.id;
        listSpanPfp.src = `img/profiles/pfp/${result.pfp}`;
        listLink.href = `profiles?id=${result.id}`;
        listItem.appendChild(listLink);
        listLink.appendChild(listSpanPfp);
        listLink.appendChild(listSpanName);
        listLink.appendChild(listSpanId);
        resultsElement.appendChild(listItem);
    });
  }
  else
  {
    search_line.style.display = "none";
    searchbar.style.borderRadius = "5pt 5pt 5pt 5pt";
  };
  
};
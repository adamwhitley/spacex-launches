import React from 'react';
import './App.css';
import { GraphQLClient } from 'graphql-request';
import { useEffect, useState } from 'react';

const launchesQuery = `{
  launches {
    id
    launch_success
    mission_name
    launch_date_utc
    launch_site {
      site_name
    }
    links {
      article_link
      video_link
    }
    rocket {
      rocket_name
    }
    details
  }
}`;

const client = new GraphQLClient('https://api.spacex.land/graphql/');
const commentsAPIKey = 'da2-tadwcysgfbgzrjsfmuf7t4huui';  // TODO: Make this inaccessible to client

/**
 * Ingests GQL data to state
 * @param query
 * @returns {{loading: boolean}}
 */
function useGraphQL(query) {
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    client.request(query).then(
      data => {
        setState({ data, loading: false });
      },
      err => {
        console.error(err);
      }
    );
  }, [query]);

  return state;
}

/**
 * Initializes Header element
 * @returns {*}
 * @constructor
 */
function Header() {
  return (
    <div className="page-head">
      <h2 className="page-head-title text-center">Space X Launches</h2>
    </div>
  );
}

/**
 * Initializes Progress Bar
 * @returns {*}
 * @constructor
 */
function Loading() {
  return (
    <div className="progress">
      <div
        className="progress-bar bg-primary progress-bar-striped progress-bar-animated"
        role="progressbar"
        style={{ width: '100%' }}
        aria-valuenow="100"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        Loading
      </div>
    </div>
  );
}

/**
 * Grabs launches from data model and
 * groups them by year then returns an
 * UL of launches sorted by date.
 * @param launches
 * @returns {*}
 * @constructor
 */
function Launches({ launches }) {
  const launchesByDate = launches.reduce((list, launch) => {
    const date = launch.launch_date_utc.slice(0, 4);
    list[date] = list[date] || [];
    list[date].push(launch);
    list[date].sort((a, b) => a.id - b.id);
    return list;
  }, {});

  return (
    <ul data-testid="launches" className="timeline timeline-variant">
      {Object.keys(launchesByDate).map(launchDate => (
        <span key={launchDate}>
          <li className="timeline-month">{launchDate}</li>
          {launchesByDate[launchDate].map(launch => (
            <Launch key={launch.id} launch={launch} />
          ))}
        </span>
      ))}
    </ul>
  );
}

/**
 * Builds image from Video ID
 * @param vID
 * @returns {*}
 * @constructor
 */
function VImg({ vID }) {
  const vImg = `https://i.ytimg.com/vi/${vID}/hqdefault.jpg`;
  return(<div className="vidHolder"><img src={vImg} alt="Launch Video" /><b>&#9656;</b></div>);
  // TODO: Switch image w/ iframe code on click
}

/**
 * Fetch GQL Comment data
 * @param ID - Flight ID
 * @returns {{loading: boolean}}
 */
function fetchComments(ID) {
  const commentsEndpoint = "https://pb3c6uzk5zhrzbcuhssogcpq74.appsync-api.us-east-1.amazonaws.com/graphql";

  const GQLClient = new GraphQLClient(commentsEndpoint, {
    headers: {
      'x-api-key': commentsAPIKey,
    },
  });

  const query = `query getFlight($flightId: Int!) {
      launchCommentsByFlightNumber(flightNumber: $flightId) {
        items {
          id
          author
          body
          date
        }
      }
    }`;

  const variables = {
    flightId: ID
  };

  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    GQLClient.request(query, variables).then(
        data => {
          setState({ data, loading: false });
        },
        err => {
          console.error(err);
        }
    );
  }, [query]);

  return state;
}

/**
 * Renders Comments component
 * @param ID
 * @returns {Promise<void>}
 */
function Comments({ID}) {
  const data = fetchComments(ID);
  console.log(data);

  // TODO: Build out comment response

  return(<div className="comments">COMMENTS</div>);
}

/**
 * Creates Launch object
 * @param id - Destructured id from Launch object
 * @param launch
 * @returns {*}
 * @constructor
 */
function Launch({ launch: {id,...launch} }) {
  const [state, setState] = useState({ showComments: false });
  const launchIcon = launch.launch_success ? (
    <i className="icon mdi mdi-rocket" />
  ) : (
    <i className="icon mdi mdi-bomb" />
  );

  let ytVid = null;
  if (launch.links.video_link) {
    ytVid = launch.links.video_link.match(/^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#]*).*/)[2];
  }

  return (
    <li className={id % 2 === 0 ? "timeline-item timeline-item-detailed right" : "timeline-item timeline-item-detailed left"}>
      <div className="timeline-content timeline-type file">
        <div className="timeline-icon">{launchIcon}</div>
        <div className="timeline-header">
          <span className="timeline-autor">
            #{id}: {launch.mission_name}
          </span>{' '}
          <p className="timeline-activity">
            {launch.rocket.rocket_name} &mdash; {launch.launch_site.site_name}
          </p>
          <span className="timeline-time">{launch.launch_date_utc.slice(0, 10)}</span>
        </div>
        <div className="timeline-summary">
          <p>{launch.details}</p>
        </div>
        <div className="mediaPanel">
          {ytVid ? <VImg vID={ytVid} /> : null}
          {launch.links.article_link ? <a href={launch.links.article_link} target="_blank" rel="noopener noreferrer">Read Article</a> : null} |
          <button type="button" className="commentsBtn" onClick={() => setState({ showComments: true })}>View Comments</button>
          {state.showComments ? <Comments ID={id} /> : null}
        </div>
      </div>
    </li>
  );
}

/**
 * Renders page content
 * @returns {*}
 * @constructor
 */
export default function App() {
  const { data, loading } = useGraphQL(launchesQuery);

  return (
    <div>
      <Header />
      {loading ? <Loading /> : <Launches launches={data.launches} />}
    </div>
  );
}

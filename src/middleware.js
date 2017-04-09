const ERROR = 'ERROR';
const INVALIDATE = 'INVALIDATE';
const INVALIDATE_PATH = 'INVALIDATE_PATH';
const REQUEST = 'REQUEST';
const RECEIVE = 'RECEIVE';
const API_INVALIDATE = 'API_INVALIDATE';
const API_INVALIDATE_PATH = 'API_INVALIDATE_PATH';
const API_REQUEST = 'API_REQUEST';

const isValidApiAction = type => {
  return type === API_REQUEST ||
    type === API_INVALIDATE ||
    type === API_INVALIDATE_PATH;
};

const jawn = ({ dispatch, getState }) =>
  next =>
    action => {
      const {
        body,
        contentType,
        method,
        name,
        query,
        type,
      } = action;
      let { path } = action;
      const apiState = getState().apiReducer;

      // Do not proceed if the action does not belong here
      if (!isValidApiAction(type)) {
        return next(action);
      }

      // Takes key value pairs and creates a query string
      // to append to path
      if (query) {
        let queryString = '';

        Object.keys(query).forEach((q, index) => {
          // Remove empty values
          if (query[q] === null || query[q] === 'undefined') {
            queryString += '';
          } else {
            if (queryString[0] !== '?') {
              queryString += `?${q}=${query[q]}`;
            } else {
              queryString += `&${q}=${query[q]}`;
            }
          }
        });

        path += queryString;
      }

      if (type === API_REQUEST) {
        // Return cached response if the path + query string
        // matches a key within the api state tree
        if (
          apiState.paths[path] &&
          !apiState.isFetching[name] &&
          (method !== 'POST' &&
            method !== 'PUT' &&
            apiState.paths[path].method === method)
        ) {
          if (__DEV__) {
            // Good to know
            console.info('CACHED RESPONSE: ', path);
          }

          // Return the promise so it behaves as the original
          // request did
          return Promise.resolve(apiState.paths[path].json);
        }

        // We should ideally just call next here
        // but I need to I want to write some tests
        dispatch({
          body,
          type: REQUEST,
          method,
          path,
          name,
        });

        // Fetch
        return request(
          path,
          {
            body,
            method,
          },
          contentType,
          name,
          dispatch
        );
      } else if (type === API_INVALIDATE) {
        window.stop();

        next({
          type: INVALIDATE,
          path,
        });
      } else if (type === API_INVALIDATE_PATH) {
        next({
          type: INVALIDATE_PATH,
          path,
        });
      } else {
        return next(action);
      }
    };

async function request(path = '', config = {}, contentType, name, dispatch) {
  let passedConfig = {
    ...config,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // For `Content-Type: 'mutlipart/form-data'` we let the browser handle accordingly
  // so that it appends the formBoundary
  if (contentType === false) {
    delete passedConfig.headers['Content-Type'];
  } else if (contentType === 'application/x-www-form-urlencoded') {
    passedConfig.headers['Content-Type'] = 'application/x-www-form-urlencoded';
  }

  let response;
  let text;
  let json;

  try {
    response = await fetch(path, passedConfig);

    let statusCode = response.status;

    if (response.status >= 200 && response.status < 300) {
      // NOTE: uilogout returns a text/html not json
      // should probably pass different headers, MT
      if (path.includes('uilogout')) {
        return response;
      }

      text = await response.text();
      json = text ? JSON.parse(text) : {};

      dispatch({
        type: RECEIVE,
        path,
        json,
        name,
      });

      return json;
    } else {
      json = await response.json();

      switch (statusCode) {
        case 400:
          throw json;

        case 401:
          throw json;

        case 403:
          throw json;

        case 500:
          throw json;

        default:
          throw json;
      }
    }
  } catch (error) {
    dispatch({
      type: ERROR,
      path,
      name,
    });

    throw error;
  }
}

export {
  jawn,
  ERROR,
  INVALIDATE,
  INVALIDATE_PATH,
  REQUEST,
  RECEIVE,
  API_INVALIDATE,
  API_INVALIDATE_PATH,
  API_REQUEST,
};

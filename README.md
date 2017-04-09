# redux-jawn
Simple Redux middleware for APIs, with support for caching and query string building.

## Installation
```
npm install --save redux-jawn
```

Then to enable, use `applyMiddleware()` as you would with any middleware in Redux.

## Usage

A simple actions file for getting sandwiches from Wawa would be as follows:

`src/actions/hoagieActions.js`

```
import { API_REQUEST, API_INVALIDATE, API_INVALIDATE_PATH } from 'redux-jawn';

// GET
export const fetchHoagies = () => {
  dispatch({
    type: API_REQUEST,
    method: 'GET',
    path: ENDPOINTS.TENANTS,
    name: 'fetchTenants',
    query,
  }).then(
    json => {
      dispatch(receiveHoagies(json));
    },
    err => console.error(err)
  );
};
```

And a simple reducer in order to leverage `isFetching` for UI loading states and caching of responses.

`src/reducer/apiReducer.js`

```
import {
  ERROR,
  INVALIDATE,
  INVALIDATE_PATH,
  REQUEST,
  RECEIVE,
} from '~src/core/api';

export const initialState = {
  isFetching: {},
  paths: {},
};

function apiReducer(state = initialState, action) {
  const { method, name, path, json, type } = action;

  switch (type) {
    case ERROR:
      return {
        ...state,
        isFetching: {
          ...state.isFetching,
          [name]: false,
        },
        paths: {
          ...state.paths,
          [path]: null,
        },
      };

    case INVALIDATE:
      return initialState;

    case INVALIDATE_PATH:
      return {
        ...state,
        paths: {
          ...state.paths,
          [path]: null,
        },
      };

    case REQUEST:
      return {
        ...state,
        isFetching: {
          ...state.isFetching,
          [name]: true,
        },
        paths: {
          ...state.paths,
          [path]: {
            ...state.paths[path],
            method,
            requestedAt: Date.now(),
          },
        },
      };

    case RECEIVE:
      return {
        ...state,
        isFetching: {
          ...state.isFetching,
          [name]: false,
        },
        paths: {
          ...state.paths,
          [path]: {
            ...state.paths[path],
            load: `${Date.now() - state.paths[path].requestedAt}ms`,
            receivedAt: Date.now(),
            json,
          },
        },
      };

    default:
      return state;
  }
}

export default apiReducer;
```

## API

- `API_REQUEST`
A dispatched action for making a request. The action requires a `method` and a `path` but can also include a `body`, `query` and `contentType`.

import React from 'react'
import { render as rtlRender } from '@testing-library/react'
import { applyMiddleware, createStore } from 'redux'
import { Provider } from 'react-redux'
import thunk from 'redux-thunk'
import reducer from '../src/redux/reducers'
import { Router } from 'react-router-dom'
import { createMemoryHistory } from 'history'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import jest from 'jest'

window.URL.createObjectURL = jest.fn()
window.URL.revokeObjectURL = jest.fn()

jest.setTimeout(10000)

Object.defineProperty(window, 'matchMedia', {
  value: jest.fn(() => {
    return {
      matches: true,
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  })
})

const render = (
  ui,
  { initialState = {}, location = {}, route = '/', ...renderOptions } = {}
) => {
  const store = createStore(reducer, initialState, applyMiddleware(thunk))

  const history = createMemoryHistory({ initialEntries: [route] })
  history.push({ ...location })

  const component = (
    <Provider store={store}>
      <Router history={history}>{ui}</Router>
    </Provider>
  )

  return { ...rtlRender(component, { ...renderOptions }), history }
}

const server = setupServer()

const mockServer = (mockDatas) => {
  const handler = []
  for (const response of mockDatas) {
    const getReq = rest.get(response.path, (req, res, ctx) => {
      return res(ctx.status(response.status || 200), ctx.json(response.body))
    })
    const postReq = rest.post(response.path, (req, res, ctx) => {
      return res(ctx.status(response.status || 200), ctx.json(response.body))
    })
    handler.push(getReq, postReq)
  }
  server.use(...handler)
  // window.__server = server
  return server
}

export * from '@testing-library/react'
export { render, mockServer }

// eslint-disable-next-line no-undef
beforeAll(() => {
  // Enable the mocking in tests.
  server.listen()
})

// eslint-disable-next-line no-undef
afterEach(() => {
  // Reset any runtime handlers tests may use.
  server.resetHandlers()
})

// eslint-disable-next-line no-undef
afterAll(() => {
  // Clean up once the tests are done.
  server.close()
})

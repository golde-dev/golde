
const config = {
  host: 'tenacify.dev',
  static: {
    'app': {
      path: '/app*',
      root: './packages/app/dist'
    },
    'website': {
      path: '/',
      root: './packages/website/dist'
    },
  },
  apis: {
    api: {
      root: './packages/api',
      template: 'node-api',
      green: [3001, 3002, 3003, 3004],
      blue: [3005, 3006, 3007, 3008]
    }
  },
  timers: {
    cleanExpired: {
      root: './packages/api',
      template: 'timer-node',
    }
  }
}


export default config
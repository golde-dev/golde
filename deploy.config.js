
const config = {
  host: 'tenacify.dev',
  static: {
    'app': {
      path: '/app*',
      root: './packages/app/dist'
    },
    'admin-ui': {
      path: '/admin*',
      root: './packages/admin/dist'
    },
    'website': {
      path: '/',
      root: './packages/website/dist'
    },
  },
  apis: {
    api: {
      root: './packages/api',
      systemdTemplate: 'node-api',
      green: [3001, 3002, 3003, 3004],
      blue: [3005, 3006, 3007, 3008]
    }
  }
}


export default config
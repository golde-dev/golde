import type {Config} from '@golde/cli';

const config: Config = {
  name: "example-aws-s3",
  providers: {
    golde: {
      apiKey: "{{ env.GOLDE_API_KEY }}",
    },
  },
  aws: {
    s3: {
      "example-aws-s3": {
        
      }
    }
  }
};

export default config
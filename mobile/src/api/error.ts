import { gql } from '@apollo/client';

gql`
  fragment ErrorFragment on Error {
    __typename
    message
  }
`;

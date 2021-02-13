import { GraphqlPageInfo } from 'src/app/models/graphql-page-info';

export interface LoginActivity {
  totalCount: number;
  pageInfo: GraphqlPageInfo;
  edges: Array<LoginActivityEdge>;
}

export interface LoginActivityNode {
  id: string;
  success?: boolean;
  ip?: string;
  createdAt?: string;
  identity?: string;
  failureReason?: string;
  userAgent?: string;
  city?: string;
  region?: string;
  country?: string;
}

export interface LoginActivityEdge {
  cursor?: string;
  node?: LoginActivityNode;
}

import { gql } from '@apollo/client';
import { Conversation } from '../Conversation';

interface RangeQuery<T> {
  from?: T;
  includeLower?: boolean;
  includeUpper?: boolean;
  to?: T;
}
type Direction = 'ASC' | 'DESC';

export class PageParam {
  page = 0;

  size = 20;

  direction: Direction;

  properties?: string[] = undefined;

  constructor(
    page = 0,
    size = 20,
    direction: Direction = 'DESC',
    properties: string[] | undefined = undefined
  ) {
    this.page = page;
    this.size = size;
    this.direction = direction;
    this.properties = properties;
  }
}

export interface ConversationQueryInput {
  // 咨询类型
  categoryList?: string[];

  // 关键字
  keyword?: string;

  // 分页参数
  page: PageParam;

  // 客服组
  staffGroupId?: number[];

  // 责任客服
  staffIdList?: number[];

  // 时间区间
  timeRange?: RangeQuery<Date | string>;

  // 总消息条数
  totalMessageCount?: RangeQuery<number>;
}

export const CONVERSATION_QUERY = gql`
  fragment ConversationFields on Conversation {
    avgRespDuration
    beginner
    category
    categoryDetail
    clientFirstMessageTime
    closeReason
    convType
    endTime
    evaluate {
      evaluation
      evaluationRemark
      evaluationType
      userResolvedStatus
    }
    firstReplyCost
    fromGroupId
    fromGroupName
    fromIp
    fromPage
    fromShuntId
    fromShuntName
    fromTitle
    fromType
    humanTransferSessionId
    id
    inQueueTime
    interaction
    isEvaluationInvited
    isStaffInvited
    isValid
    nickName
    organizationId
    realName
    relatedId
    relatedType
    remarks
    roundNumber
    staffFirstReplyTime
    staffId
    staffMessageCount
    startTime
    status
    stickDuration
    terminator
    totalMessageCount
    transferFromGroup
    transferFromStaffName
    transferRemarks
    transferType
    treatedTime
    userId
    userMessageCount
    userName
    vipLevel
    visitRange
  }
`;

export interface ConversationGraphql {
  getConversation: Conversation;
}

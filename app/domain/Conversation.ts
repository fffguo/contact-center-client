/** 会话管理 */
import {
  CloseReason,
  ConversationType,
  FromType,
  RelatedType,
  SolveStatus,
  TransferType,
} from './constant/Conversation';
import { CreatorType } from './constant/Message';

/** 会话信息 */
export interface Conversation {
  id: number;
  organizationId: number;
  fromShuntId: number;
  fromGroupId: number;
  fromIp: string;
  fromPage: string;
  fromTitle: string;
  fromType: FromType;
  inQueueTime: number;
  interaction: number;
  cType: ConversationType;
  staffId: number;
  startTime: Date;
  userId: number;
  vipLevel: number;
  /** 来访时间差，单位毫秒 */
  visitRange: number;
  transferType: TransferType;
  humanTransferSessionId: number;
  transferFromStaffName: string | undefined;
  transferFromGroup: string | undefined;
  transferRemarks: string | undefined;
  isStaffInvited: boolean;
  relatedId: number;
  relatedType: RelatedType;
  category: string | undefined;
  categoryDetail: string | undefined;
  closeReason: CloseReason | undefined;
  endTime: Date | undefined;
  evaluate: string | undefined;
  staffFirstReplyTime: Date | undefined;
  firstReplyCost: number;
  stickDuration: number;
  remarks: string | undefined;
  status: SolveStatus | undefined;
  roundNumber: number;
  clientFirstMessageTime: Date | undefined;
  avgRespDuration: number;
  isValid: number;
  staffMessageCount: number;
  userMessageCount: number;
  treatedTime: number;
  isEvaluationInvited: boolean | undefined;
  terminator: CreatorType | undefined;
  beginner: CreatorType;
}

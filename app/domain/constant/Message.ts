export enum MessageType {
  /** 系统消息 */
  SYS = '系统',
  /** 文本消息 */
  TEXT = '文本',
  /** 图片消息 */
  IMAGE = '图片表情',
  /** 语音消息 */
  VOICE = '语音',
  /** 文件消息 */
  FILE = '文件',
  /** 链接消息 */
  LINK = '链接',
}

export type MessageTypeKey = keyof typeof MessageType;

/**
 * 参考钉钉设计的创建者类型
 * 不同于钉钉的 普通消息/OA消息 区分
 * 这里区分不同的使用者类型 (客服/客户)
 */
export enum CreatorType {
  /** 系统 */
  SYS,
  /** 工作人员 */
  STAFF,
  /** 客户 */
  CUSTOMER,
  /** 群聊 */
  GROUP,
}

export enum SysCode {
  // 更新列队
  UPDATE_QUEUE,
  // 分配列队
  ASSIGN,
  // 无答案
  NO_ANSWER,
  // 修改在线状态
  ONLINE_STATUS_CHANGED,
}

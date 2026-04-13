// 意图类型枚举 / Intent type enum
export enum IntentType {
  // 页面自动化操作 / Page automation operation
  PAGE_OPERATION = 'page_operation',
  // 纯对话交流 / Pure conversation
  CONVERSATION = 'conversation',
  // 无法判断，需要询问用户 / Cannot determine, need to ask user
  UNKNOWN = 'unknown',
}

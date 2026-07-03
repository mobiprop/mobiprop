export type MessageParticipantDto = {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: string;
};

export type MessageAttachmentDto = {
  id: string;
  fileName: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
};

export type MessageDto = {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  attachments: MessageAttachmentDto[];
};

export type ConversationSummaryDto = {
  id: string;
  otherUser: MessageParticipantDto;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  isStarred: boolean;
  isArchived: boolean;
};

export type ChatAttachmentUploadTicketDto = {
  attachmentId: string;
  storagePath: string;
  signedUrl: string;
  token: string;
  originalFileName: string;
  mimeType: string;
};

import { create } from "zustand";

export type ModalName =
  | "ADD_LISTING"
  | "ADD_AGENT"
  | "ADD_CONTACT"
  | "ADD_LEAD"
  | "ADD_OPPORTUNITY"
  | "ADD_CONTRACT"
  | "SCHEDULE_TOUR"
  | "CONTACT_AGENT"
  | "CONFIRM_DELETE";

type ModalState = {
  activeModal: ModalName | null;
  modalPayload: unknown | null;
  openModal: (modal: ModalName, payload?: unknown) => void;
  closeModal: () => void;
};

export const useModalStore = create<ModalState>((set) => ({
  activeModal: null,
  modalPayload: null,

  openModal: (modal, payload = null) =>
    set({
      activeModal: modal,
      modalPayload: payload,
    }),

  closeModal: () =>
    set({
      activeModal: null,
      modalPayload: null,
    }),
}));

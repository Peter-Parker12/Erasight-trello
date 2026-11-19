import { notifyCardAssigned, notifyReviewReady, sendDueTodayReminder } from "@/lib/board-telegram";
import { notifyZaloCardAssigned, notifyZaloReviewReady, sendZaloDueTodayReminder } from "@/lib/board-zalo";

// Fan-out to every chat channel a board may have configured. Each channel
// no-ops when the board has no enabled config for it.

export const notifyBoardCardAssigned = async (
  params: Parameters<typeof notifyCardAssigned>[0]
): Promise<void> => {
  await Promise.allSettled([notifyCardAssigned(params), notifyZaloCardAssigned(params)]);
};

export const notifyBoardReviewReady = async (
  params: Parameters<typeof notifyReviewReady>[0]
): Promise<void> => {
  await Promise.allSettled([notifyReviewReady(params), notifyZaloReviewReady(params)]);
};

export const sendBoardDueTodayReminder = async (
  params: Parameters<typeof sendDueTodayReminder>[0]
): Promise<void> => {
  await Promise.allSettled([sendDueTodayReminder(params), sendZaloDueTodayReminder(params)]);
};

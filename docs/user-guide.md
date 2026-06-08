# User Guide

## 1. Creating and Setting Up a Task (Card)

### 1.1 Create a card
1. Open a board and find the list you want to add the task to.
2. Click **"Add a card"** at the bottom of the list.
3. Type the task name into the field (placeholder: *"Enter a title for this card..."*).
   - Press **Enter** to save, **Shift+Enter** for a new line, **Escape** to cancel.
   - If your organization has card templates, click **"Dùng template"** to start from one.
4. Click **"Add card"** to create it. The card is created with a title and an auto-generated card number (e.g. `#123`).

### 1.2 Open the card to add details
Click the card to open the card modal. The left side shows the card's content (title, description, subtasks, checklists, attachments, comments, activity); the right sidebar ("Add to card") lets you attach metadata such as members, labels, dates, priority, etc.

### 1.3 Title
Click the title at the top of the modal and edit it inline.

### 1.4 Description
1. In the **Description** section, click into the text area (placeholder: *"Add a more detailed description..."*).
2. Type your description (Markdown is supported, with a live preview).
3. Click **Save** to confirm, or **Cancel** to discard.

### 1.5 Subtasks
1. In the **Subtasks** section, click **"+ Add subtask"**.
2. Type the subtask title (placeholder: *"Subtask title..."*).
3. Press **Enter** or click **Add** to save (**Escape**/**Cancel** to discard).
4. Track progress via the `{done}/{total}` counter; open a subtask with its external-link icon to view it as its own card.

### 1.6 Due date and start date
1. In the right sidebar, click **Dates**.
2. Fill in **Start date** and/or **Due date** using the date pickers.
3. Click **Save**.

Both dates are then shown on the card (in the "Dates" summary, on the board card preview, and in the Calendar view). Due-date badges change color depending on status: gray (upcoming), yellow (due soon), red (overdue), green (completed).

### 1.7 Assignee (Members)
1. In the right sidebar, click **Members**.
2. Pick a person from the list of board members to assign them to the card.
3. To remove someone, click **Remove** next to their name in the assigned list.

Assigned members appear as avatars on the card and in list/calendar views. If a member has configured their Telegram username (see section 2), they will get a Telegram notification when assigned.

### 1.8 Priority
1. In the right sidebar, click **Priority**.
2. Choose one of: **None**, **Low**, **Medium**, **High**, **Urgent**.

The chosen priority shows as a color-coded badge on the card (gray/blue/yellow/orange/red) and can be used to group or sort cards in List view.

### 1.9 Labels
1. In the right sidebar, click **Labels**.
2. Toggle the checkbox next to existing labels to apply/remove them.
3. To create a new label, scroll to the **Create label** section, type a name (placeholder: *"Name"*), pick one of the 9 preset colors, and click **Create**.

### 1.10 Attachments
1. In the right sidebar, click **Attachment** (or use the **Attachments** section in the card body and click **"+ Thêm đính kèm"**).
2. Choose a method:
   - **Nhập URL** (Enter URL): fill in a display name and the `https://...` link, then click **Đính kèm** / **Attach**.
   - **Tải file lên** (Upload file): drag a file into the drop zone or click **"Nhấn để chọn file"** to browse. Max size 5MB; images, PDF, Office documents, and video are supported.
3. Click an attachment to expand it and see its preview, type, size, upload time, and URL. From there you can **Tải xuống** (Download), **Mở liên kết** (Open link), or **Sao chép** (Copy URL).

### 1.11 Other useful actions (right sidebar "Actions")
- **Cover**: pick a color to highlight the card.
- **Checklist**: add a titled checklist with individual checkable items and a progress bar.
- **Watch / Unwatch**: get notified about changes to the card.
- **Save as Template**, **Copy**, **Delete**.

---

## 2. Configuring Your Telegram Username

Setting your Telegram username lets boards notify you on Telegram when a task is assigned to you.

### 2.1 Get your Telegram username
1. Open the Telegram app.
2. Go to **Settings → Username** and set one if you don't already have one.
3. Note the username **without** the leading `@` (e.g. if your handle is `@johndoe`, your username is `johndoe`).

### 2.2 Add it to the platform
1. In the top navbar, click the **Send (paper-plane) icon** next to the notification bell. This opens the **"My Telegram"** popover.
2. Read the description: *"Set your Telegram username so boards can tag you when a task is assigned to you."*
3. In the **Telegram username** field, type your username (placeholder: *"username (without @)"* — the leading `@` is stripped automatically if you include it).
4. Click **Save**. You'll see a confirmation toast: *"Telegram username saved"*.
5. To remove it later, reopen the popover and click **Remove** (you'll see *"Telegram username removed"*).

### 2.3 What you'll be notified about
Once your username is set, you will receive Telegram messages for boards that have a Telegram bot configured (an admin sets this up via the board's **Telegram** button), for events such as:
- Being assigned to a card
- Review requests (when a card moves into the board's designated "review" list)
- Due-date reminders

> Note: notifications only work if **both** your personal username is set **and** the board admin has linked and enabled a Telegram bot for that board.

---

## 3. Switching Between Views

At the top of a board, use the **view toggle** (a button group with **Board**, **List**, and **Calendar**) to change how cards are displayed. The selected view is reflected in the URL (`?view=board`, `?view=list`, `?view=calendar`).

### 3.1 Board view (default)
- Classic Kanban layout: lists are columns, cards are draggable items within and between lists.
- Each card preview shows its title, number, cover color, priority badge, due-date badge, labels, assigned members, comment count, and attachment count.
- Click a card to open the full card modal; drag and drop to reorder or move cards between lists.

### 3.2 List view
- Shows all cards from the board in a single table, with columns: **Title**, **List**, **Labels**, **Priority**, **Due Date**, **Checklist**, **Activity**, **Members**.
- Use **"Group by:"** to group rows by **List**, **Priority**, or **Assignee**. Click a group's header to expand/collapse it.
- Within each group, cards are sorted by priority by default (Urgent → High → Medium → Low → None).
- Select cards using the checkboxes (a header checkbox selects all visible rows). A toolbar then shows the selection count and a **"Clear selection"** button.
- Click any row to open that card's modal.

### 3.3 Calendar view
- Displays a month grid (Monday–Sunday). Use the chevron buttons to move to the previous/next month; the current month and year are shown in the header (e.g. "June 2026").
- Cards appear on the day matching their **due date** (up to 3 per day; click **"+N more"** to see additional ones). The current day is highlighted.
- Card chips are color-coded by status: green + strikethrough (completed), red (overdue), the card's cover color (if set and not completed), or plain white (no special status).
- Cards **without** a due date are listed in a footer section: *"{count} card(s) with no due date"*.
- Click any card chip to open its card modal.

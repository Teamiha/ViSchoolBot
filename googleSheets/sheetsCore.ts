import { Bot } from "@grammyjs/bot";


export async function updateCalendarReminders() {
  Deno.cron("updateCalendarReminders", `0 3 * * *`, async () => {
    try {
      console.log("Бот проснулся.");
      await cleanupPastEvents();
      await saveGoogleEvent();
      await setupDelayedEvent(await getAllEvents());
      console.log("Утренее обновление напоминаний завершено.");
    } catch (error) {
      console.error(
        "Ошибка при утренем обновлении напоминаний:",
        error,
      );
    }
  });
}

export async function cleanupPastEvents() {
  try {
    const kv = await getKv();
    const prefix = ["reltubBot", "Google_event"];

    const eventsIterator = kv.list<GoogleCalendarEvent>({ prefix });
    const currentTime = new Date().getTime();

    for await (const entry of eventsIterator) {
      const event = entry.value;
      const eventEndTime = event.end.dateTime || event.end.date;

      if (!eventEndTime) {
        console.log(`Событие ${event.id} не имеет времени окончания`);
        continue;
      }

      const eventEndTimestamp = new Date(eventEndTime).getTime();

      if (eventEndTimestamp < currentTime) {
        await kv.delete(["reltubBot", "Google_event", `event:${event.id}`]);
        console.log(
          `Удалено прошедшее событие: ${event.summary} (ID: ${event.id})`,
        );
      }
    }

    console.log("Очистка прошедших событий завершена");
  } catch (error) {
    console.error("Ошибка при очистке прошедших событий:", error);
  }
}

export async function saveGoogleEvent() {
  try {
    const calendars = [IDESOS_CALENDAR_ID, CASTLE_CALENDAR_ID];
    const kv = await getKv();

    for (const calendarId of calendars) {
      const events = await getCalendarEventsForNext24Hours(calendarId);

      for (const event of events) {
        const existingEvent = await kv.get([
          "reltubBot",
          "Google_event",
          `event:${event.id}`,
        ]);
        if (existingEvent.value) {
          console.log(`Событие с ID ${event.id} уже существует в базе`);
          continue;
        }

        const googleEvent: GoogleCalendarEvent = {
          id: event.id,
          summary: event.summary,
          description: event.description,
          start: event.start,
          end: event.end,
          calendarId: calendarId,
        };
        await kv.set(
          ["reltubBot", "Google_event", `event:${event.id}`],
          googleEvent,
        );
        console.log(`Событие с ID ${event.id} успешно сохранено`);
      }
    }

    console.log("Обработка новых событий завершена");
  } catch (error) {
    console.error("Ошибка при сохранении событий в Deno.kv:", error);
  }
}

export async function getAllEvents(): Promise<GoogleCalendarEvent[]> {
  try {
    const kv = await getKv();
    const prefix = ["reltubBot", "Google_event"];
    const eventsIterator = kv.list<GoogleCalendarEvent>({ prefix });

    const events: GoogleCalendarEvent[] = [];

    for await (const entry of eventsIterator) {
      const event = entry.value;
      events.push(event);
    }

    console.log(`Получено ${events.length} событий`);
    return events;
  } catch (error) {
    console.error("Ошибка при получении событий:", error);
    return [];
  }
}

export async function setupDelayedEvent(events: GoogleCalendarEvent[]) {
  console.log("Начало планирования отложенных событий");
  try {
    const kv = await getKv();

    for (const event of events) {
      const existingReminder = await kv.get([
        "reltubBot",
        "delayedEvent",
        event.id,
      ]);
      if (existingReminder.value !== null) {
        console.log(`Уведомление для события ${event.id} уже запланировано`);
        continue;
      }

      const now = new Date().getTime();
      const eventStartTime = event.start.dateTime || event.start.date;
      if (!eventStartTime) {
        console.log(`Событие ${event.id} не имеет времени начала`);
        continue;
      }
      const eventStart = new Date(eventStartTime).getTime();
      const delay = eventStart - now;

      // Пропускаем события, которые уже начались или слишком далеко в будущем
      if (delay <= 0) {
        console.log(`Событие ${event.id} уже началось, пропускаем`);
        continue;
      }

      // Создаем отложенное уведомление
      await kv.enqueue(
        {
          action: "EXECUTE_DELAYED_EVENT",
          eventId: event.id,
        },
        { delay },
      );

      // Помечаем событие как запланированное
      await kv.set(
        ["reltubBot", "delayedEvent", event.id],
        true,
        { expireIn: delay },
      );

      console.log(
        `Уведомление для события ${event.id} запланировано через ${
          Math.floor(delay / 1000 / 60)
        } минут`,
      );
    }

    console.log("Планирование отложенных событий завершено");
  } catch (error) {
    console.error("Ошибка при планировании отложенных событий:", error);
  }
}

export async function initializeQueueListener(bot: Bot<MyContext>) {
  const kv = await getKv();
  await kv.listenQueue(async (message) => {
    if (message.action === "EXECUTE_DELAYED_EVENT") {
      try {
        if (!message.eventId) {
          console.error("Получено сообщение без eventId");
          return;
        }

        const eventEntry = await kv.get<GoogleCalendarEvent>([
          "reltubBot",
          "Google_event",
          `event:${message.eventId}`,
        ]);

        if (!eventEntry.value) {
          console.error(`Событие с ID ${message.eventId} не найдено`);
          return;
        }

        const targetGroupId = eventEntry.value.calendarId === IDESOS_CALENDAR_ID
          ? IDESOS_GROUP_ID
          : CASTLE_PUBLIC_GROUP_ID;

        await sendCalendarEventToGroup(bot, targetGroupId, message.eventId);
        await kv.delete(["reltubBot", "delayedEvent", message.eventId]);
        console.log(
          `Уведомление для события ${message.eventId} успешно отправлено в группу ${targetGroupId}`,
        );
      } catch (error) {
        console.error("Ошибка при отправке уведомления о событии:", error);
      }
    }
  });
}

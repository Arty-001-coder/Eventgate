import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const eventsFilePath = path.join(process.cwd(), 'app', 'admin', 'events.json');

export async function POST(request: NextRequest) {
  try {
    const newEvent = await request.json();

    // Read existing events
    const fileContents = await fs.readFile(eventsFilePath, 'utf8');
    const eventsData = JSON.parse(fileContents);

    // Add new event to rolledEvents
    eventsData.rolledEvents.push(newEvent);

    // Write back to file
    await fs.writeFile(eventsFilePath, JSON.stringify(eventsData, null, 2), 'utf8');

    return NextResponse.json({ success: true, event: newEvent }, { status: 200 });
  } catch (error) {
    console.error('Error saving event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save event' },
      { status: 500 }
    );
  }
}


import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AppState } from '@/types';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Migration Utility for LocalStorage -> PostgreSQL
 * This route accepts a JSON payload of the AppState and inserts it into the database.
 * Secured via Supabase Auth Session.
 */
export async function POST(request: Request) {
  try {
    const userSession = await getSession();
    if (!userSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data: AppState = await request.json();

    if (!data.profile) {
      return NextResponse.json({ error: 'No profile found to migrate' }, { status: 400 });
    }

    // Ensure user exists in DB first
    const user = await prisma.user.upsert({
      where: { id: userSession.id },
      update: {},
      create: {
        id: userSession.id,
        email: userSession.email || "migrated@example.com",
        role: "STUDENT"
      }
    });

    // 2. Upsert Profile
    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        targetRole: data.profile.targetRole
      },
      create: {
        userId: user.id,
        firstName: "Migrated",
        lastName: "User",
        targetRole: data.profile.targetRole
      }
    });

    // 3. Migrate Education (Semesters)
    // Here you would transform data.semesters into Education records

    // 4. Migrate Projects
    if (data.projects) {
      for (const proj of data.projects) {
        await prisma.project.create({
          data: {
            profileId: profile.id,
            name: proj.name,
            description: proj.description,
            technologies: [proj.technology],
          }
        });
      }
    }

    // 5. Migrate Predictions
    // ...

    return NextResponse.json({ success: true, message: 'Data migrated successfully' });
  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}

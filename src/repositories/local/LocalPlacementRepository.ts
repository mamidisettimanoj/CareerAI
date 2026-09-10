import { db } from '@/lib/db';
import { 
  PlacementDrive, 
  Application, 
  ApplicationEvent, 
  OnlineTest, 
  InterviewRound, 
  Offer 
} from '@/domain/placement/types/placement.types';

export class LocalPlacementRepository {
  async saveDrive(drive: PlacementDrive): Promise<void> {
    if (!db) return;
    try { await db.drives.put(drive); } catch (e) { console.error(e); }
  }

  async getDrives(): Promise<PlacementDrive[]> {
    if (!db) return [];
    try { return await db.drives.toArray(); } catch (e) { return []; }
  }

  async saveApplication(app: Application): Promise<void> {
    if (!db) return;
    try { await db.applications.put(app); } catch (e) { console.error(e); }
  }

  async getApplications(): Promise<Application[]> {
    if (!db) return [];
    try { return await db.applications.toArray(); } catch (e) { return []; }
  }

  async getApplicationById(id: string): Promise<Application | undefined> {
    if (!db) return undefined;
    try { return await db.applications.get(id); } catch (e) { return undefined; }
  }

  async deleteApplication(id: string): Promise<void> {
    if (!db) return;
    try {
      await db.transaction('rw', [db.applications, db.applicationEvents, db.onlineTests, db.interviews, db.offers], async () => {
        await db.applications.delete(id);
        
        // Cascade delete child records
        const events = await db.applicationEvents.where('applicationId').equals(id).toArray();
        await db.applicationEvents.bulkDelete(events.map(e => e.id));
        
        const tests = await db.onlineTests.where('applicationId').equals(id).toArray();
        await db.onlineTests.bulkDelete(tests.map(t => t.id));
        
        const interviews = await db.interviews.where('applicationId').equals(id).toArray();
        await db.interviews.bulkDelete(interviews.map(i => i.id));
        
        const offers = await db.offers.where('applicationId').equals(id).toArray();
        await db.offers.bulkDelete(offers.map(o => o.id));
      });
    } catch (e) { console.error(e); }
  }

  async saveApplicationEvent(event: ApplicationEvent): Promise<void> {
    if (!db) return;
    try { await db.applicationEvents.put(event); } catch (e) { console.error(e); }
  }

  async getApplicationEvents(appId: string): Promise<ApplicationEvent[]> {
    if (!db) return [];
    try { 
      return await db.applicationEvents.where('applicationId').equals(appId).toArray(); 
    } catch (e) { return []; }
  }

  async saveOnlineTest(test: OnlineTest): Promise<void> {
    if (!db) return;
    try { await db.onlineTests.put(test); } catch (e) { console.error(e); }
  }

  async getOnlineTests(appId: string): Promise<OnlineTest[]> {
    if (!db) return [];
    try { return await db.onlineTests.where('applicationId').equals(appId).toArray(); } catch (e) { return []; }
  }

  async saveInterviewRound(interview: InterviewRound): Promise<void> {
    if (!db) return;
    try { await db.interviews.put(interview); } catch (e) { console.error(e); }
  }

  async getInterviewRounds(appId: string): Promise<InterviewRound[]> {
    if (!db) return [];
    try { return await db.interviews.where('applicationId').equals(appId).toArray(); } catch (e) { return []; }
  }

  async getInterviews(): Promise<InterviewRound[]> {
    if (!db) return [];
    try { return await db.interviews.toArray(); } catch (e) { return []; }
  }

  async saveOffer(offer: Offer): Promise<void> {
    if (!db) return;
    try { await db.offers.put(offer); } catch (e) { console.error(e); }
  }

  async getOffers(appId?: string): Promise<Offer[]> {
    if (!db) return [];
    try { 
      if (appId) {
        return await db.offers.where('applicationId').equals(appId).toArray(); 
      }
      return await db.offers.toArray(); 
    } catch (e) { return []; }
  }
}

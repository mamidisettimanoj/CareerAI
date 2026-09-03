export class CareerAIContextBuilder {
  /**
   * Safely transforms full domain models into a minimal stringified JSON representation.
   * Strips all PII, IDs, and raw sensitive metadata.
   */
  static buildSafeContext(profileData: any, additionalContext?: any): string {
    const safeData = {
      targetRole: profileData.profile?.targetRole || 'Not specified',
      readiness: profileData.engineResult?.overallScore || 'Insufficient Data',
      academic: {
        cgpa: profileData.semesters?.[0]?.sgpa || 'Unknown', // Simplification
      },
      skills: profileData.skills?.map((s: any) => ({
        name: s.name,
        proficiency: s.proficiencyScore
      })) || [],
      assessments: profileData.predictions || [], // Needs proper mapping in a real flow
      ...additionalContext
    };

    return `
--- STRUCTURED CAREERAI DATA ---
${JSON.stringify(safeData, null, 2)}
---------------------------------`;
  }

  /**
   * Wraps untrusted user input with clear delimitation to prevent prompt injection.
   */
  static wrapUntrustedInput(content: string): string {
    return `
--- UNTRUSTED USER CONTENT START ---
${content}
--- UNTRUSTED USER CONTENT END ---`;
  }
}

import { describe, it, expect } from 'vitest'
import { emsMockApi, mockHospitals } from '../features/ems/api/emsMockApi'

describe('EMS Mission Workflow & Hospital Locations API', () => {
  it('returns valid hospital locations with Google Maps URLs', async () => {
    const hospitals = await emsMockApi.getHospitals()
    expect(hospitals.length).toBeGreaterThan(0)
    hospitals.forEach((h) => {
      expect(h.googleMapsUrl).toBeDefined()
      expect(h.googleMapsUrl).toContain('google.com/maps')
      expect(h.latitude).toBeGreaterThan(0)
      expect(h.longitude).toBeGreaterThan(0)
    })
  })

  it('manages mission lifecycle from active to completion', async () => {
    const active = await emsMockApi.getActiveMission()
    expect(active).not.toBeNull()

    const ack = await emsMockApi.acknowledgeMission(active!.incident.id)
    expect(ack.status).toBe('EN_ROUTE')

    const arrived = await emsMockApi.confirmArrivalOnScene()
    expect(arrived.status).toBe('ON_SCENE')

    const safety = await emsMockApi.saveSceneSafety(true, [])
    expect(safety.status).toBe('PATIENT_CARE')

    const transport = await emsMockApi.selectHospitalAndSendPreAlert(mockHospitals[0].id, ['STEMI Prep'])
    expect(transport.status).toBe('TRANSPORTING')

    const handover = await emsMockApi.completeHandover({
      hospitalId: mockHospitals[0].id,
      receivingDoctorName: 'Dr. Test',
      receivingNurseName: 'Nurse Test',
      handoverTime: new Date().toISOString(),
      vitalSignsAtHandover: { timestamp: new Date().toISOString() },
      belongingsHandedOver: true,
      signatureCaptured: true,
    })
    expect(handover.status).toBe('HANDOVER')

    const completed = await emsMockApi.completeMission({
      completedAt: new Date().toISOString(),
      totalDistanceKm: 10,
      outcome: 'PATIENT_DELIVERED',
      summaryNotes: 'Test complete',
      vehicleCleanedAndRestocked: true,
    })
    expect(completed.status).toBe('COMPLETED')
  })
})

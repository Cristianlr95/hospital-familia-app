import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { PatientEventService } from './patient-event.service';

describe('PatientEventService', () => {
  let service: PatientEventService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PatientEventService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(PatientEventService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('serializes an optional tutor date range', () => {
    service.getUpcomingEventsForTutor('patient-1', {
      from: '2026-06-01T00:00:00.000Z',
      to: '2026-07-01T00:00:00.000Z',
    }).subscribe();

    const request = httpTesting.expectOne((candidate) => (
      candidate.url === `${environment.apiUrl}/patients/patient-1/events`
      && candidate.params.get('from') === '2026-06-01T00:00:00.000Z'
      && candidate.params.get('to') === '2026-07-01T00:00:00.000Z'
    ));
    expect(request.request.method).toBe('GET');
    request.flush({ data: [] });
  });

  it('omits range params when staff requests the default window', () => {
    service.getEventsForStaff('patient-1').subscribe();

    const request = httpTesting.expectOne(`${environment.apiUrl}/events/patient/patient-1`);
    expect(request.request.params.keys()).toEqual([]);
    request.flush({ data: [] });
  });

  it('reuses a cached monthly request', () => {
    const range = {
      from: '2026-06-01T00:00:00.000Z',
      to: '2026-07-01T00:00:00.000Z',
    };
    service.getEventsForStaff('patient-1', range).subscribe();
    service.getEventsForStaff('patient-1', range).subscribe();

    const requests = httpTesting.match((candidate) => (
      candidate.url === `${environment.apiUrl}/events/patient/patient-1`
      && candidate.params.get('from') === range.from
      && candidate.params.get('to') === range.to
    ));
    expect(requests.length).toBe(1);
    requests[0].flush({ data: [] });
  });
});

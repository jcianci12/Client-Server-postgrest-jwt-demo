import { Injectable } from '@angular/core';
import { Observable, switchMap, of } from 'rxjs';
import { 
  Client, 
  CheckInRequest, 
  CheckInRequestType, 
  CheckInResponse, 
  JobsiteQRCodeResponse,
  SubcontractorCreate,
  VisitorResponse,
  SubcontractorResponse,
  Contact_info,
  Company,
  Inducted,
  notes9
} from '../api/api';

/**
 * Unified service for handling check-ins, supporting both:
 * 1. Admin-initiated check-ins (from the admin interface)
 * 2. QR code-based check-ins (from the public check-in flow)
 * 
 * This service handles both the check-in process and the creation of visitor/subcontractor records
 */
@Injectable({
  providedIn: 'root'
})
export class UnifiedCheckInService {
  constructor(private client: Client) {}
  
  /**
   * Performs a check-in using an existing QR token
   * Used by the public check-in flow
   * Also creates a visitor or subcontractor record based on the check-in type
   */
  checkInWithToken(
    jobsiteId: number,
    name: string,
    contactInfo: string,
    type: CheckInRequestType,
    token: string,
    company?: string,
    inducted?: boolean | null,
    additionalNotes?: string,
    qtyOfMen?: number
  ): Observable<{
    checkInResponse: CheckInResponse,
    entityResponse: VisitorResponse | SubcontractorResponse | null
  }> {
    // Create the check-in request
    const request = new CheckInRequest({
      jobsite_id: jobsiteId,
      name: name,
      contact_info: contactInfo as unknown as Contact_info,
      type: type,
      token: token
    });
    
    // Add optional fields
    if (company) {
      request.company = company as unknown as Company;
    }
    
    if (inducted !== null && inducted !== undefined) {
      // Set the inducted field to the boolean value
      request.inducted = inducted as unknown as Inducted;
    }
    
    // Add additional notes if provided
    if (additionalNotes) {
      request['notes'] = additionalNotes as unknown as notes9;
    }
    
    // Perform the check-in
    return this.client.check_in_api_qrcodes_check_in_post(request).pipe(
      switchMap((checkInResponse: CheckInResponse) => {
        // For visitors, the visitor record is now created by the check-in endpoint
        if (type === CheckInRequestType.Visitor) {
          return of({
            checkInResponse,
            entityResponse: null
          });
        } else if (type === CheckInRequestType.Contractor) {
          // Create subcontractor record
          const subcontractorData = new SubcontractorCreate({
            company_name: company || name, // Use name as company if not provided
            qty_of_men: qtyOfMen || 1, // Default to 1 if not specified
            start_time: new Date().toISOString(),
            finish_time: new Date().toISOString(), // Required field, can be updated later
            jobsite_id: jobsiteId
          });
          
          if (additionalNotes) {
            subcontractorData.notes = additionalNotes as unknown as notes9;
          }
          
          return this.client.create_subcontractor_api_subcontractors__post(subcontractorData).pipe(
            switchMap((subcontractorResponse: SubcontractorResponse) => {
              return of({
                checkInResponse,
                entityResponse: subcontractorResponse
              });
            })
          );
        } else {
          // If type is not recognized, just return the check-in response
          return of({
            checkInResponse,
            entityResponse: null
          });
        }
      })
    );
  }
  
  /**
   * Admin-initiated check-in
   * First fetches the QR code data for the jobsite, then performs the check-in
   * Also creates a visitor or subcontractor record based on the check-in type
   */
  adminCheckIn(
    jobsiteId: number,
    name: string,
    contactInfo: string,
    type: CheckInRequestType,
    company?: string,
    inducted?: boolean | null,
    additionalNotes?: string,
    qtyOfMen?: number
  ): Observable<{
    checkInResponse: CheckInResponse,
    entityResponse: VisitorResponse | SubcontractorResponse | null
  }> {
    // First, get the QR code data for the jobsite
    return this.client.get_qr_code_data_api_qrcodes_get_qr_code_data__jobsite_id__get(jobsiteId)
      .pipe(
        switchMap((qrCodeData: JobsiteQRCodeResponse) => {
          // Then use the token to perform the check-in and create entity
          return this.checkInWithToken(
            jobsiteId,
            name,
            contactInfo,
            type,
            qrCodeData.qr_code_id,
            company,
            inducted,
            additionalNotes,
            qtyOfMen
          );
        })
      );
  }
  
  /**
   * Handles the response from a check-in operation
   * Stores relevant data in session storage for confirmation page
   */
  storeCheckInData(
    response: {
      checkInResponse: CheckInResponse,
      entityResponse: VisitorResponse | SubcontractorResponse | null
    }, 
    checkInData: {
      name: string,
      contactInfo: string,
      type: 'visitor' | 'contractor',
      company?: string,
      inducted?: boolean | null
    }
  ): void {
    const checkInResponse = response.checkInResponse;
    
    // Store form data in session storage for confirmation page
    sessionStorage.setItem('check_in_name', checkInData.name);
    sessionStorage.setItem('check_in_contact', checkInData.contactInfo || '');
    sessionStorage.setItem('check_in_type', checkInData.type);
    
    if (checkInData.company) {
      sessionStorage.setItem('check_in_company', checkInData.company);
    }
    
    if (checkInData.inducted !== undefined && checkInData.inducted !== null) {
      sessionStorage.setItem('inducted', checkInData.inducted.toString());
    }
    
    // Store response data for confirmation page
    sessionStorage.setItem('check_in_success', checkInResponse.success.toString());
    sessionStorage.setItem('check_in_message', checkInResponse.message);
    sessionStorage.setItem('check_in_jobsite_name', checkInResponse.jobsite_name);
    sessionStorage.setItem('check_in_time', checkInResponse.check_in_time.toISOString());
    sessionStorage.setItem('check_in_diary_entry_id', checkInResponse.diary_entry_id.toString());
    
    // Store entity ID if available
    if (response.entityResponse) {
      if ('visitor_id' in response.entityResponse) {
        sessionStorage.setItem('visitor_id', (response.entityResponse as VisitorResponse)['visitor_id'].toString());
      } else if ('subcontractor_id' in response.entityResponse) {
        sessionStorage.setItem('subcontractor_id', (response.entityResponse as SubcontractorResponse)['subcontractor_id'].toString());
      }
    }
  }
  
  /**
   * Clears all check-in related data from session storage
   */
  clearCheckInData(): void {
    // Clear session storage
    sessionStorage.removeItem('qr_token');
    sessionStorage.removeItem('jobsite_id');
    sessionStorage.removeItem('jobsite_name');
    sessionStorage.removeItem('jobsite_address');
    sessionStorage.removeItem('check_in_type');
    sessionStorage.removeItem('inducted');
    sessionStorage.removeItem('check_in_name');
    sessionStorage.removeItem('check_in_contact');
    sessionStorage.removeItem('check_in_company');
    
    // Clear API response data
    sessionStorage.removeItem('check_in_success');
    sessionStorage.removeItem('check_in_message');
    sessionStorage.removeItem('check_in_jobsite_name');
    sessionStorage.removeItem('check_in_time');
    sessionStorage.removeItem('check_in_diary_entry_id');
    sessionStorage.removeItem('visitor_id');
    sessionStorage.removeItem('subcontractor_id');
  }
} 
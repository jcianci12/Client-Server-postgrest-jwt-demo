import { of, throwError } from 'rxjs';
import { CompanyResponse, Address, Contact_number } from '../../api/api';

export const mockAddress: Address = new Address({
  street: '123 Test St',
  city: 'Test City',
  state: 'Test State',
  postal_code: '12345'
});

export const mockContactNumber: Contact_number = new Contact_number({
  country_code: '+1',
  number: '1234567890'
});

export const mockCompanyResponse: Partial<CompanyResponse> = {
  id: 1,
  name: 'Test Company',
  address: mockAddress,
  contact_number: mockContactNumber,
  created_at: new Date(),
  updated_at: new Date(),
  members: []
};

export const mockClient = {
  get_current_company_api_companies_current_get: jasmine.createSpy().and.returnValue(of(mockCompanyResponse)),
  get_companies_api_companies_get: jasmine.createSpy().and.returnValue(of([mockCompanyResponse])),
  create_company_api_companies_post: jasmine.createSpy().and.returnValue(of(mockCompanyResponse)),
  set_current_company_api_users_current_company__company_id__put: jasmine.createSpy().and.returnValue(of({}))
};

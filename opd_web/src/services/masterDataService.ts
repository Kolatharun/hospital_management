import { api } from './api';

export interface MasterDataItem {
    id: string;
    code: string;
    category?: string;
}

export interface Complaint extends MasterDataItem {
    complaint: string;
}

export interface Diagnosis extends MasterDataItem {
    diagnosis: string;
}

export interface LabTest extends MasterDataItem {
    test_name: string;
}

export interface Medicine extends MasterDataItem {
    name: string;
    generic_name?: string;
    specialization: string;
    dosage_form?: string;
    strength?: string;
}

class MasterDataService {
    async searchComplaints(query: string, limit: number = 20): Promise<Complaint[]> {
        if (!query || query.length < 1) return [];
        return api.get<Complaint[]>(`/master/complaints/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    }

    async searchDiagnosis(query: string, limit: number = 20): Promise<Diagnosis[]> {
        if (!query || query.length < 1) return [];
        return api.get<Diagnosis[]>(`/master/diagnosis/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    }

    async searchLabTests(query: string, limit: number = 20): Promise<LabTest[]> {
        if (!query || query.length < 1) return [];
        return api.get<LabTest[]>(`/master/lab-tests/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    }

    async searchMedicines(query: string, limit: number = 20): Promise<Medicine[]> {
        if (!query || query.length < 3) return [];
        return api.get<Medicine[]>(`/master/medicines/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    }
}

export const masterDataService = new MasterDataService();
export default masterDataService;

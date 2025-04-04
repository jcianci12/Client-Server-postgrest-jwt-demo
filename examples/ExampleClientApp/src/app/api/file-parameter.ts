/**
 * FileParameter interface for file uploads
 * This interface is used to represent file uploads in API requests
 */
export interface FileParameter {
    data: Blob;
    fileName?: string;
} 
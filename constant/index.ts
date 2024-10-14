
export const validContentType = [
    new RegExp('text/plain'),
    new RegExp('text/csv'),
    new RegExp('image/*'),
    new RegExp('video/*'),
    new RegExp('application/json'),
    new RegExp('application/vnd.efi.iso'),
    new RegExp('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
]

export enum displaystatus{
    'active'  = 1,
    'deleted' = 2,
    'pending' = 3,
}
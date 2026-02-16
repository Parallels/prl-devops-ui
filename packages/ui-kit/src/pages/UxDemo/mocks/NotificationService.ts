
export const notificationService = {
    success: (options: any) => console.log('Notification Success:', options),
    error: (options: any) => console.error('Notification Error:', options),
    info: (options: any) => console.log('Notification Info:', options),
    warning: (options: any) => console.warn('Notification Warning:', options),
    createNotification: (options: any) => console.log('Create Notification:', options),
};

export default notificationService;

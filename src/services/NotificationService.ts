
export interface Notification {
    id: string;
    message: string;
    details?: string;
    autoClose?: boolean;
    dismissible?: boolean;
    showAsToast?: boolean;
    channel?: string;
    type?: string;
}

const createNotification = (notification: Notification) => {
    console.log('Notification created', notification);
};

export default {
    createNotification,
};

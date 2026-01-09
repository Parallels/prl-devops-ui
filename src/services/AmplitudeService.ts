export const amplitudeService = {
    emitEvent: (eventName: string, data?: any) => {
        console.log('Amplitude Event:', eventName, data);
    }
};

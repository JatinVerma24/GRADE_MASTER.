const S3Client = {
    list: async () => {
        console.log("Mock S3 Client list called");
        return [];
    },
    file: (key: string) => {
        return {
            presign: (options: any) => {
                return `https://mock-s3-upload-url.local${key}`;
            }
        };
    }
};

export default S3Client;

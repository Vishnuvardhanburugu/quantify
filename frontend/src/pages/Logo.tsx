const Logo = () => {
    return (
        <div className="w-full min-h-screen bg-black flex items-center justify-center">
            <video
                autoPlay
                playsInline
                muted={false}
                className="w-full h-full"
                style={{ maxHeight: "100vh", objectFit: "contain" }}
                onEnded={(e) => {
                    const video = e.currentTarget;
                    video.currentTime = video.duration;
                    video.pause();
                }}
            >
                <source src="/quantify_logo_animation.mp4" type="video/mp4" />
            </video>
        </div>
    );
};

export default Logo;

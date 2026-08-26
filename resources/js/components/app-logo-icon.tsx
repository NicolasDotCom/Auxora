import { ImgHTMLAttributes } from 'react';

interface AppLogoIconProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
    className?: string;
}

export default function AppLogoIcon(props: AppLogoIconProps) {
    return (
        <img 
            {...props} 
            src="/images/logo-transparent-128.png" 
            alt="Logo Auxora"
            className={`object-contain ${props.className || ''}`}
        />
    );
}

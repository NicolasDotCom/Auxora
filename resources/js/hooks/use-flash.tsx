import { PageProps } from "@/types";
import { usePage } from "@inertiajs/react";
import { useEffect } from "react";
import { toast } from "sonner";

export default function useFlash() {
    const {flash} = usePage<PageProps>().props;

    useEffect(()=>{
        if(flash.success){
            toast.success(flash.success);
        }
        if(flash.error){
            toast.error(flash.error);
        }
        if(flash.warning){
            toast.warning(flash.warning);
        }
        if(flash.info){
            toast.info(flash.info);
        }
    }, [flash]);

    return {
        success: flash.success,
        error: flash.error,
        warning: flash.warning,
        info: flash.info,
    }
}




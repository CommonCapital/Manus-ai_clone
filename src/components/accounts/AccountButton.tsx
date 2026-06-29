import { useSession } from "next-auth/react"
import { AuthButton } from "./AuthButton";


const AccountButton = () => {
    const {data:session} = useSession()

    return (
        <div className="border-t border-birder mt-auto p-2">
<div
className="flex w-full items-center gap-3 rounded-lg px-3 py-2
transition-colors hover:bg-muted focus:bg-muted/80 focus:outline
"

>
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
        <AuthButton session={session}/>
    </span>
    <div className="flex min-w-0 flex-1 flex-col text-left">
<p className="truncate text-sm font-medium text-foreground">
{session?.user?.name}
</p>
<p className="whitespace-nowrap text-xs text-muted-foreground">
    Personal account
</p>
    </div>

</div>
        </div>
    )
};


export default AccountButton;
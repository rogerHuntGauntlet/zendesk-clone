import Link from 'next/link'
import { Button } from '@/components/ui/button'

function Error({ statusCode }: { statusCode: number }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">{statusCode}</h1>
        <p className="text-xl text-white/80 mb-8">
          {statusCode
            ? `An error ${statusCode} occurred on server`
            : 'An error occurred on client'}
        </p>
        <Link href="/">
          <Button variant="outline" className="bg-white/10 hover:bg-white/20 text-white">
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  )
}

Error.getInitialProps = ({ res, err }: { res: any, err: any }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error 
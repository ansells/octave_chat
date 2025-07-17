import { InfoIcon } from 'lucide-react';

export default function ChatInstructions() {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <InfoIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Welcome to Octave Chat
          </h3>
          <div className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
            Use this chat to ask for information about companies or people at
            companies to research potential customers. This chat will utilize
            Octive&apos;s agents to provide enriched information.<br></br>
            Some things you can do:
            <ul className="list-disc list-inside">
              <li>
                Ask for enriched information about a company (provide a company
                domain (i.e. example.com) for more reliable results)
              </li>
              <li>
                Ask for enriched information about a person at a company
                (provide a linkedin profile URL for more reliable results)
              </li>
              <li>
                Generate emails to send to a person at a company (provide a
                linkedin profile URL for more reliable results)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

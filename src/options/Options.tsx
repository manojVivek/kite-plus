import {useState, useEffect} from 'react';

export const Options = () => {
  const [xirrEnabled, setXirrEnabled] = useState(true);

  useEffect(() => {
    chrome.storage.sync.get(['xirrEnabled'], result => {
      setXirrEnabled(Boolean(result.xirrEnabled));
    });
  }, []);

  return (
    <main className="flex flex-col gap-8 m-8 min-w-[400px]">
      <div>
        <h1 className="text-2xl">Kite Plus Extension</h1>
        <p>An extension that adds some cool new features to Kite.</p>
      </div>

      <div>
        <h2 className="text-lg">Preferences</h2>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <input
              id="count"
              type="checkbox"
              checked={xirrEnabled}
              onChange={e => {
                setXirrEnabled(e.target.checked);
                chrome.storage.sync.set({xirrEnabled: e.target.checked});
              }}
            />
            <label htmlFor="count">XIRR field</label>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Options;

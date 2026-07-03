export default function ScenePreviewList({ scenes = [], assets = [], resolveUrl }) {
  return (
    <section className="card">
      <h2>Scene Visuals</h2>
      <div className="sceneList">
        {scenes.map((scene, index) => {
          const asset = assets.find(item => item.sceneOrder === scene.order) || assets[index];
          return (
            <article className="sceneItem" key={scene.order || index}>
              <strong>Scene {scene.order || index + 1}</strong>
              <p>{scene.subtitle || scene.narration}</p>
              {asset && (
                <>
                  <small>{asset.status} - {asset.prompt}</small>
                  {asset.assetUrl && (
                    <a
                      className="smallDownload"
                      href={resolveUrl ? resolveUrl(asset.assetUrl) : asset.assetUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open Asset Manifest
                    </a>
                  )}
                </>
              )}
            </article>
          );
        })}
        {!scenes.length && <p>Script generate hone ke baad scene previews yahan dikhenge.</p>}
      </div>
    </section>
  );
}

export default function ScenePreviewList({ scenes = [], assets = [] }) {
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
              {asset && <small>{asset.status} · {asset.prompt}</small>}
            </article>
          );
        })}
        {!scenes.length && <p>Script generate hone ke baad scene previews yahan dikhenge.</p>}
      </div>
    </section>
  );
}

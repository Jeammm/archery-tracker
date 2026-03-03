# ArgoCD setup for archery-tracker

ArgoCD syncs the Kubernetes manifests from this repo (`k8s/`) into your k3s cluster. You do **not** need to write extra manifests to "link to the image"—the `k8s/` manifests already reference the images; ArgoCD just applies them.

## 1. One-time setup

1. **Edit the Application manifest**  
   In `argocd/application.yaml`, set `spec.source.repoURL` to your repo, e.g.:
   - `https://github.com/jeammm/archery-tracker`  
   Replace `REPO_OWNER` with your GitHub org or username.

2. **Private repo (if applicable)**  
   In ArgoCD, add a repository credential (Settings → Repositories) so ArgoCD can clone the repo. Use HTTPS + token or SSH key.

3. **Apply the Application**  
   Register the app with ArgoCD (run once):
   ```bash
   kubectl apply -n argocd -f argocd/application.yaml
   ```
   Or from the ArgoCD UI: **New App** → paste the contents of `argocd/application.yaml` (after fixing `repoURL`).

4. **Sync**  
   ArgoCD will create the `archery-tracker` namespace and apply everything under `k8s/` (backend, frontend, redis, celery, services). If auto-sync is on, it will keep the cluster in sync with the `main` branch.

## 2. What ArgoCD does

- **Source of truth**: This Git repo; path `k8s/`.
- **Images**: The `k8s/*.yaml` files already point at the container images (e.g. `ghcr.io/owner/archery-backend:<tag>`). No extra "link" manifest is needed.
- **Image tags**: The GitHub Action **Build and push images** builds backend/frontend on push to `main` and updates the image tags in `k8s/` to the new commit SHA. ArgoCD then syncs and rolls out the new images.

## 3. Optional: push images to a different org

If you want images under a different GitHub org (e.g. `jeammm`) while the repo is under another owner, set the repo variable **`REGISTRY_OWNER`** (e.g. `jeammm`) in the repo settings. The workflow will then push to `ghcr.io/jeammm/archery-backend` and `ghcr.io/jeammm/archery-frontend`, and the manifest-update step will write the same image refs into `k8s/`.

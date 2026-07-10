/**
 * AuthUI.js
 * Handles the Trello Authorization UI state and interactions
 */

export class AuthUI {
  constructor(t, { authContainerId, btnAuthorizeId, onAuthorized }) {
    this.t = t;
    this.authContainer = document.getElementById(authContainerId);
    this.btnAuthorize = document.getElementById(btnAuthorizeId);
    this.onAuthorized = onAuthorized;

    this._initListeners();
  }

  _initListeners() {
    if (this.btnAuthorize) {
      this.btnAuthorize.addEventListener("click", async () => {
        try {
          await this.t.getRestApi().authorize({ scope: "read" });
          this.hide();
          if (this.onAuthorized) this.onAuthorized();
        } catch (e) {
          // Silent failure
        }
      });
    }
  }

  show() {
    if (this.authContainer) this.authContainer.hidden = false;
  }

  hide() {
    if (this.authContainer) this.authContainer.hidden = true;
  }
}

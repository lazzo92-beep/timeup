/**
 * @jest-environment jsdom
 */

import { jest, describe, test, expect, beforeEach } from "@jest/globals";
import { AuthUI } from "../../src/ui/AuthUI.js";

describe("AuthUI", () => {
  let t;
  let authUI;
  let authContainer;
  let btnAuthorize;

  beforeEach(() => {
    t = {
      getRestApi: jest.fn().mockReturnValue({
        authorize: jest.fn().mockResolvedValue(),
      }),
    };

    document.body.innerHTML = `
            <div id="auth-container" hidden></div>
            <button id="btn-auth"></button>
        `;

    authContainer = document.getElementById("auth-container");
    btnAuthorize = document.getElementById("btn-auth");

    authUI = new AuthUI(t, {
      authContainerId: "auth-container",
      btnAuthorizeId: "btn-auth",
      onAuthorized: jest.fn(),
    });
  });

  test("show() unhides container", () => {
    authUI.show();
    expect(authContainer.hidden).toBe(false);
  });

  test("hide() hides container", () => {
    authContainer.hidden = false;
    authUI.hide();
    expect(authContainer.hidden).toBe(true);
  });

  test("authorize button click triggers auth flow", async () => {
    btnAuthorize.click();

    // Wait for async handler
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(t.getRestApi().authorize).toHaveBeenCalledWith(
      expect.objectContaining({ scope: "read" }),
    );
  });
});

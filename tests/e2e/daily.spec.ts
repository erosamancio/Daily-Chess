import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { Chess } from "chess.js";
import { dayNumber, todayKey } from "../../lib/daily";
import type { DailyEntry } from "../../lib/types";

const schedule: DailyEntry[] = JSON.parse(readFileSync(join(__dirname, "..", "..", "data", "daily-schedule.json"), "utf8"));
const today = schedule[(dayNumber(todayKey()) - 1) % schedule.length].puzzle;

const square = (page: Page, sq: string) => page.locator(`#puzzle-board-board [data-square="${sq}"]`);

async function clickMove(page: Page, uci: string) {
  await square(page, uci.slice(0, 2)).click();
  await square(page, uci.slice(2, 4)).click();
  if (uci.length > 4) await page.getByRole("dialog").getByRole("button").first().click();
}

async function skipOnboarding(page: Page) {
  const dialog = page.getByRole("dialog");
  for (let i = 0; i < 3; i++) await dialog.getByRole("button").last().click();
  await expect(dialog).toBeHidden();
}

test("resolve o desafio do dia com erro e dica, e o streak sobe", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await skipOnboarding(page);

  const goal = /^mateIn(\d)$/.exec(today.theme) ? /Encontre o mate em/ : /Encontre o melhor lance/;
  await expect(page.getByText(goal)).toBeVisible({ timeout: 15_000 });

  // Um lance legal errado (que não seja mate) é rejeitado.
  const pos = new Chess(today.fen);
  pos.move({ from: today.moves[0].slice(0, 2), to: today.moves[0].slice(2, 4), promotion: today.moves[0][4] });
  const wrong = pos.moves({ verbose: true }).find((m) => {
    const probe = new Chess(pos.fen());
    probe.move(m);
    return m.from + m.to !== today.moves[1].slice(0, 4) && !probe.isCheckmate() && !m.promotion;
  })!;
  await clickMove(page, wrong.from + wrong.to);
  await expect(page.getByText("Não é esse. Tente de novo.").first()).toBeVisible();

  await page.getByRole("button", { name: "Dica" }).click();

  for (let i = 1; i < today.moves.length; i += 2) {
    await page.waitForTimeout(700);
    await clickMove(page, today.moves[i]);
  }

  await expect(page.getByRole("heading", { name: "Resolvido!" })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("Resolvido com ajuda.")).toBeVisible();
  await expect(page.getByRole("link", { name: /Sequência: 1/ })).toBeVisible();

  await page.getByRole("button", { name: "Compartilhar" }).click();
  await expect(page.getByRole("button", { name: "Copiado!" })).toBeVisible();
  const shared = await page.evaluate(() => navigator.clipboard.readText());
  expect(shared).toContain(`Daily Chess #${dayNumber(todayKey())}`);
  expect(shared).toContain("🟨");

  // Depois de recarregar, o resultado continua salvo.
  await page.reload();
  await expect(page.getByRole("heading", { name: "Resolvido!" })).toBeVisible();
});

test("treino por tema carrega um puzzle", async ({ page }) => {
  await page.goto("/treino");
  await page.getByRole("link", { name: /Garfo/ }).click();
  await expect(page.getByRole("heading", { name: "Garfo" })).toBeVisible();
  await expect(page.getByText("Encontre o melhor lance")).toBeVisible({ timeout: 15_000 });
});

test("rush começa com cronômetro e vidas", async ({ page }) => {
  await page.goto("/rush");
  await page.getByRole("button", { name: "Começar" }).click();
  await expect(page.getByText("Vidas", { exact: true })).toBeVisible();
  await expect(page.locator("#puzzle-board-board")).toBeVisible();
});

test("clássico: Mate do Pastor", async ({ page }) => {
  await page.goto("/classicos/mate-do-pastor");
  await expect(page.getByText("Encontre o mate em 1")).toBeVisible();
  await clickMove(page, "h5f7");
  await expect(page.getByRole("heading", { name: "Resolvido!" })).toBeVisible();
});

test("arquivo abre um dia anterior e inglês funciona", async ({ page }) => {
  await page.goto("/arquivo/2026-10-01");
  await expect(page.getByRole("heading", { name: /Desafio de/ }).first()).toBeVisible();
  await page.goto("/en/treino");
  await expect(page.getByRole("heading", { name: "Train by theme" })).toBeVisible();
});

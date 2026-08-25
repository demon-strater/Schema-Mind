import { expect, test } from "@playwright/test";
for (const fixture of [{ id: "study-c", condition: "C", visible: "검색 결과" }, { id: "study-a", condition: "A", visible: "AI 요약" }, { id: "study-f", condition: "F", visible: "관계망을 탐색" }]) {
  test(`${fixture.condition} condition completes day one`, async ({ page }) => {
    await page.goto(`/study/${fixture.id}`);
    await expect(page.getByText(`조건 ${fixture.condition}`, { exact: false }).first()).toBeVisible();
    await page.getByRole("button", { name: "과제 시작" }).click();
    await expect(page.getByText(fixture.visible, { exact: false }).first()).toBeVisible();
    if (fixture.condition === "A") await expect(page.getByText("관계망을 탐색", { exact: false })).toHaveCount(0);
    await page.getByLabel("당신의 결론과 근거").fill("두 전략의 효과와 한계를 출처에 근거하여 비교한 참가자 응답입니다.");
    await page.getByRole("button", { name: "과제 제출" }).click();
    await expect(page.getByText("응답이 저장되었습니다.")).toBeVisible();
  });
}
test("framework interfaces operate", async ({ page }) => {
  await page.goto("/cluster"); await page.getByRole("button", { name: "예시 질문 시작" }).click(); await expect(page.getByText("상충", { exact: true }).first()).toBeVisible();
  await page.goto("/canvas"); await page.getByRole("button", { name: "논증 구조 분석" }).click(); await expect(page.getByText("보증", { exact: true })).toBeVisible();
  await page.goto("/schema"); await page.getByRole("button", { name: "정박점 후보 확인" }).click(); await expect(page.getByText("어디에 연결하시겠습니까?")).toBeVisible();
});

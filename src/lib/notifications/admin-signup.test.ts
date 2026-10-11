import { beforeEach, describe, expect, it, vi } from "vitest";

const sendEmail = vi.fn();
let admins: string[] = [];

vi.mock("server-only", () => ({}));
vi.mock("@/lib/email/send", () => ({ sendEmail: (...args: unknown[]) => sendEmail(...args) }));
vi.mock("@/lib/env", () => ({ getServerEnv: () => ({ ADMIN_EMAILS: admins }) }));

const { notifyAdminsOfSignup } = await import("./admin-signup");

const signup = {
  businessName: "Barbearia do Zé",
  nicheName: "Barbearia",
  email: "ze@gmail.com",
  whatsapp: null,
  pageUrl: "https://meetchat.com.br/barbearia-do-ze",
  via: "conversa" as const,
  trial: "started" as const,
};

describe("notifyAdminsOfSignup", () => {
  beforeEach(() => {
    sendEmail.mockReset();
    admins = [];
  });

  it("e-mails every admin with who signed up", async () => {
    admins = ["dono@meetchat.com.br", "socia@meetchat.com.br"];
    await notifyAdminsOfSignup(signup);
    expect(sendEmail).toHaveBeenCalledOnce();
    const input = sendEmail.mock.calls[0]![0];
    expect(input.to).toEqual(admins);
    expect(input.subject).toBe("Novo cadastro: Barbearia do Zé (Barbearia)");
    expect(input.content.details).toEqual(
      expect.arrayContaining([
        { label: "E-mail", value: "ze@gmail.com" },
        { label: "WhatsApp", value: "Não informado" },
        { label: "Link", value: signup.pageUrl },
        { label: "Teste", value: "14 dias do Completo" },
      ]),
    );
  });

  it("does nothing without admins", async () => {
    await notifyAdminsOfSignup(signup);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("never breaks the sign-up when the e-mail fails", async () => {
    admins = ["dono@meetchat.com.br"];
    sendEmail.mockRejectedValueOnce(new Error("Resend down"));
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(notifyAdminsOfSignup(signup)).resolves.toBeUndefined();
    error.mockRestore();
  });
});

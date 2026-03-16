import { useState } from "react";
import { Menu, Button } from "react-native-paper";
import { useTranslation } from "react-i18next";

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const [visible, setVisible] = useState(false);

  return (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      anchor={
        <Button mode="text" onPress={() => setVisible(true)}>
          {t("language")}
        </Button>
      }
    >
      <Menu.Item
        title={t("english")}
        onPress={() => {
          void i18n.changeLanguage("en");
          setVisible(false);
        }}
      />
      <Menu.Item
        title={t("shona")}
        onPress={() => {
          void i18n.changeLanguage("sn");
          setVisible(false);
        }}
      />
    </Menu>
  );
}

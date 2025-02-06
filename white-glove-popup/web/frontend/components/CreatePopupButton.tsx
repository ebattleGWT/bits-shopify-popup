import { Button } from '@shopify/polaris';
import { useNavigate } from '@shopify/app-bridge-react';

interface CreatePopupButtonProps {
  onClick?: () => void;
}

export function CreatePopupButton({ onClick }: CreatePopupButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    navigate("/popups/new");
  };

  return (
    <Button primary onClick={handleClick}>
      Create popup
    </Button>
  );
} 